import { PortfolioService } from '@ghostfolio/api/app/portfolio/portfolio.service';
import { UserService } from '@ghostfolio/api/app/user/user.service';
import {
  nullifyValuesInObject,
  nullifyValuesInObjects
} from '@ghostfolio/api/helper/object.helper';
import { ImpersonationService } from '@ghostfolio/api/services/impersonation.service';
import { Accounts } from '@ghostfolio/common/interfaces';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import type {
  AccountWithValue,
  RequestWithUser
} from '@ghostfolio/common/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Inject,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Account as AccountModel, Platform } from '@prisma/client';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { AccountService } from './account.service';
import { CreateAccountDto } from './create-account.dto';
import { UpdateAccountDto } from './update-account.dto';

@Controller('account')
export class AccountController {
  public constructor(
    private readonly accountService: AccountService,
    private readonly impersonationService: ImpersonationService,
    private readonly portfolioService: PortfolioService,
    @Inject(REQUEST) private readonly request: RequestWithUser,
    private readonly userService: UserService
  ) { }

  @Get('get-all-accounts-by-institution-wise')
  @UseGuards(AuthGuard('jwt'))
  public getAllAccountsByInstitutionWise(): any {
    return this.accountService.getAllAccountsByInstitutionWise(this.request.user.id);
  }

  @Get('getallaccounts-types-with-its-sub-types')
  @UseGuards(AuthGuard('jwt'))
  public async getAccountsTypesWithItsSubTypes() {
    return this.accountService.getAccountsTypesWithItsSubTypes();
  }


  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  public async deleteAccount(@Param('id') id: string): Promise<AccountModel> {
    if (
      !hasPermission(this.request.user.permissions, permissions.deleteAccount)
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    const account = await this.accountService.accountWithOrders(
      {
        id_userId: {
          id,
          userId: this.request.user.id
        }
      },
      { Order: true }
    );

    if (account?.isDefault || account?.Order.length > 0) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    return this.accountService.deleteAccount(
      {
        id_userId: {
          id,
          userId: this.request.user.id
        }
      },
      this.request.user.id
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  public async getAllAccounts(
    @Headers('impersonation-id') impersonationId
  ): Promise<Accounts> {
    const impersonationUserId =
      await this.impersonationService.validateImpersonationId(
        impersonationId,
        this.request.user.id
      );

    let accountsWithAggregations =
      await this.portfolioService.getAccountsWithAggregations({
        userId: impersonationUserId || this.request.user.id,
        withExcludedAccounts: true
      });

    if (
      impersonationUserId ||
      this.userService.isRestrictedView(this.request.user)
    ) {
      accountsWithAggregations = {
        ...nullifyValuesInObject(accountsWithAggregations, [
          'totalBalanceInBaseCurrency',
          'totalValueInBaseCurrency'
        ]),
        accounts: nullifyValuesInObjects(accountsWithAggregations.accounts, [
          'balance',
          'balanceInBaseCurrency',
          'convertedBalance',
          'fee',
          'quantity',
          'unitPrice',
          'value',
          'valueInBaseCurrency'
        ])
      };
    }

    return accountsWithAggregations;
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  public async getAccountById(
    @Headers('impersonation-id') impersonationId,
    @Param('id') id: string
  ): Promise<AccountWithValue> {
    const impersonationUserId =
      await this.impersonationService.validateImpersonationId(
        impersonationId,
        this.request.user.id
      );

    let accountsWithAggregations =
      await this.portfolioService.getAccountsWithAggregations({
        filters: [{ id, type: 'ACCOUNT' }],
        userId: impersonationUserId || this.request.user.id,
        withExcludedAccounts: true
      });

    if (
      impersonationUserId ||
      this.userService.isRestrictedView(this.request.user)
    ) {
      accountsWithAggregations = {
        ...nullifyValuesInObject(accountsWithAggregations, [
          'totalBalanceInBaseCurrency',
          'totalValueInBaseCurrency'
        ]),
        accounts: nullifyValuesInObjects(accountsWithAggregations.accounts, [
          'balance',
          'balanceInBaseCurrency',
          'convertedBalance',
          'fee',
          'quantity',
          'unitPrice',
          'value',
          'valueInBaseCurrency'
        ])
      };
    }

    return accountsWithAggregations.accounts[0];
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  public async createAccount(
    @Body() data: CreateAccountDto
  ): Promise<AccountModel> {
    if (
      !hasPermission(this.request.user.permissions, permissions.createAccount)
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    data.platformId = null;
    if (!data.platformId) {
      delete data.platformId;
      const accountSubTypeId = data.accountSubTypeId;
      delete data.accountSubTypeId;

      const manualPlatform: Platform = await this.accountService.getManualPlatform();

      return this.accountService.createAccount(
        {
          ...data,
          User: { connect: { id: this.request.user.id } },
          AccountSubTypes: { connect: { id: accountSubTypeId } },
          Platform: { connect: { id: manualPlatform.id } },
        },
        this.request.user.id
      );
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  public async update(@Param('id') id: string, @Body() data: UpdateAccountDto) {
    if (
      !hasPermission(this.request.user.permissions, permissions.updateAccount)
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    const originalAccount = await this.accountService.account({
      id_userId: {
        id,
        userId: this.request.user.id
      }
    });

    if (!originalAccount) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    if (data.platformId) {
      const platformId = data.platformId;
      delete data.platformId;

      const finalData = { ...data };
      delete finalData['accountSubTypeId'];

      return this.accountService.updateAccount(
        {
          data: {
            ...finalData,
            Platform: { connect: { id: platformId } },
            User: { connect: { id: this.request.user.id } },
            AccountSubTypes: { connect: { id: data.accountSubTypeId } }
          },
          where: {
            id_userId: {
              id,
              userId: this.request.user.id
            }
          }
        },
        this.request.user.id
      );
    } else {
      // platformId is null, remove it
      delete data.platformId;
      const accountSubTypeId = data.accountSubTypeId;
      delete data.accountSubTypeId;

      return this.accountService.updateAccount(
        {
          data: {
            ...data,
            Platform: originalAccount.platformId
              ? { disconnect: true }
              : undefined,
            User: { connect: { id: this.request.user.id } },
            AccountSubTypes: {
              connect: { id: accountSubTypeId }
            }
          },
          where: {
            id_userId: {
              id,
              userId: this.request.user.id
            }
          }
        },
        this.request.user.id
      );
    }
  }


  @UseGuards(AuthGuard('jwt'))
  @Post('delete-account-by-institution/:institutionId')
  public async onDeleteAccountByInstitution(@Param('institutionId') institutionId: string) {
    return this.accountService.onDeleteAccountByInstitution(this.request.user.id, institutionId);
  }



}
