import { ExchangeRateDataService } from '@ghostfolio/api/services/exchange-rate-data.service';
import { PrismaService } from '@ghostfolio/api/services/prisma.service';
import { Filter } from '@ghostfolio/common/interfaces';
import { HttpException, Injectable } from '@nestjs/common';
import { Account, Order, Platform, Prisma, Institution } from '@prisma/client';
import Big from 'big.js';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { groupBy } from 'lodash';
import { use } from 'passport';

import { CashDetails } from './interfaces/cash-details.interface';

@Injectable()
export class AccountService {
  public constructor(
    private readonly exchangeRateDataService: ExchangeRateDataService,
    private readonly prismaService: PrismaService
  ) { }

  public async getAccountsTypesWithItsSubTypes() {

    const data = await this.prismaService.accountTypes.findMany({
      include: {
        AccountSubTypes: true,
      }
    })

    return data;

  }

  public async getAllAccountsByInstitutionWise(userId: string): Promise<any> {

    // Finding all accounts of user
    const userAccounts = await this.prismaService.account.findMany({
      where: {
        userId: userId
      },
      include: {
        Institution: {
          select: {
            institutionName: true
          }
        }
      }
    })

    let totalBalanceInBaseCurrency = 0;


    const institutionsAccounts = {};
    const manualAccounts = [];

    for (let i = 0; i < userAccounts.length; i++) {
      if (userAccounts[i].institutionId) {
        // if institution present then

        // eslint-disable-next-line no-prototype-builtins
        if (institutionsAccounts.hasOwnProperty(userAccounts[i].Institution.institutionName)) {
          institutionsAccounts[userAccounts[i].Institution.institutionName].push(userAccounts[i]);
        } else {
          institutionsAccounts[userAccounts[i].Institution.institutionName] = []
          institutionsAccounts[userAccounts[i].Institution.institutionName].push(userAccounts[i]);
        }


      } else {
        // if institution null then
        manualAccounts.push(userAccounts[i]);
      }
      totalBalanceInBaseCurrency += userAccounts[i].balance;
    }


    return {
      institutionsAccounts,
      manualAccounts,
      totalBalanceInBaseCurrency,
    }
  }


  public async account(
    accountWhereUniqueInput: Prisma.AccountWhereUniqueInput
  ): Promise<Account | null> {
    return this.prismaService.account.findUnique({
      where: accountWhereUniqueInput
    });
  }

  public async accountWithOrders(
    accountWhereUniqueInput: Prisma.AccountWhereUniqueInput,
    accountInclude: Prisma.AccountInclude
  ): Promise<
    Account & {
      Order?: Order[];
    }
  > {
    return this.prismaService.account.findUnique({
      include: accountInclude,
      where: accountWhereUniqueInput
    });
  }

  public async accounts(params: {
    include?: Prisma.AccountInclude;
    skip?: number;
    take?: number;
    cursor?: Prisma.AccountWhereUniqueInput;
    where?: Prisma.AccountWhereInput;
    orderBy?: Prisma.AccountOrderByWithRelationInput;
  }): Promise<
    (Account & {
      Order?: Order[];
      Platform?: Platform;
    })[]
  > {
    const { include, skip, take, cursor, where, orderBy } = params;

    return this.prismaService.account.findMany({
      cursor,
      include,
      orderBy,
      skip,
      take,
      where,
    });

  }

  public async createAccount(
    data: Prisma.AccountCreateInput,
    aUserId: string
  ): Promise<Account> {
    return this.prismaService.account.create({
      data
    });
  }

  public async deleteAccount(
    where: Prisma.AccountWhereUniqueInput,
    aUserId: string
  ): Promise<Account> {
    return this.prismaService.account.delete({
      where
    });
  }

  public async getAccounts(aUserId: string) {
    const accounts = await this.accounts({
      include: { Order: true, Platform: true },
      orderBy: { name: 'asc' },
      where: { userId: aUserId }
    });

    return accounts.map((account) => {
      let transactionCount = 0;

      for (const order of account.Order) {
        if (!order.isDraft) {
          transactionCount += 1;
        }
      }

      const result = { ...account, transactionCount };

      delete result.Order;

      return result;
    });
  }

  public async getCashDetails({
    currency,
    filters = [],
    userId,
    withExcludedAccounts = false
  }: {
    currency: string;
    filters?: Filter[];
    userId: string;
    withExcludedAccounts?: boolean;
  }): Promise<CashDetails> {
    let totalCashBalanceInBaseCurrency = new Big(0);

    const where: Prisma.AccountWhereInput = {
      userId
    };

    if (withExcludedAccounts === false) {
      where.isExcluded = false;
    }

    const {
      ACCOUNT: filtersByAccount,
      ASSET_CLASS: filtersByAssetClass,
      TAG: filtersByTag
    } = groupBy(filters, (filter) => {
      return filter.type;
    });

    if (filtersByAccount?.length > 0) {
      where.id = {
        in: filtersByAccount.map(({ id }) => {
          return id;
        })
      };
    }

    const accounts = await this.accounts({ where });

    for (const account of accounts) {
      totalCashBalanceInBaseCurrency = totalCashBalanceInBaseCurrency.plus(
        this.exchangeRateDataService.toCurrency(
          account.balance,
          account.currency,
          currency
        )
      );
    }

    return {
      accounts,
      balanceInBaseCurrency: totalCashBalanceInBaseCurrency.toNumber()
    };
  }

  public async updateAccount(
    params: {
      where: Prisma.AccountWhereUniqueInput;
      data: Prisma.AccountUpdateInput;
    },
    aUserId: string
  ): Promise<Account> {
    const { data, where } = params;
    return this.prismaService.account.update({
      data,
      where
    });
  }

  public async onDeleteAccountByInstitution(userId: string, institutionId: string) {

    try {

      await this.prismaService.account.deleteMany({
        where: {
          userId: userId,
          institutionId: institutionId,
        }
      })

      const plaidToken = await this.prismaService.plaidToken.findFirst({
        where: {
          userId: userId,
          Institution: {
            id: institutionId
          }
        }
      })

      await this.prismaService.plaidToken.delete({
        where: {
          id: plaidToken.id,
        }
      })

      return { error: false, msg: 'Deleted Successfully' }
    } catch (error) {
      return { error: true, msg: 'Deletion failed!' }
    }

  }

  public async getManualPlatform() {

    try {

      let platform = await this.prismaService.platform.findUnique({
        where: {
          url: 'https://macrosifter.com'
        }
      })

      if (platform) {
        return platform;
      }

      if (!(platform)) {

        platform = await this.prismaService.platform.create({
          data: {
            url: 'https://macrosifter.com',
            name: 'Manual Account',
          }
        })

        return platform;

      }

    } catch (error) {
      console.log(error);
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );

    }

  }

}
