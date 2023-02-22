/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { AccountService } from '@ghostfolio/api/app/account/account.service';
import { DataGatheringService } from '@ghostfolio/api/services/data-gathering.service';
import { ExchangeRateDataService } from '@ghostfolio/api/services/exchange-rate-data.service';
import { PrismaService } from '@ghostfolio/api/services/prisma.service';
import { SymbolProfileService } from '@ghostfolio/api/services/symbol-profile.service';
import {
  GATHER_ASSET_PROFILE_PROCESS,
  GATHER_ASSET_PROFILE_PROCESS_OPTIONS
} from '@ghostfolio/common/config';
import { Filter } from '@ghostfolio/common/interfaces';
import { OrderWithAccount } from '@ghostfolio/common/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns'
import {
  AssetClass,
  AssetSubClass,
  DataSource,
  Order,
  Prisma,
  Tag,
  Type as TypeOfOrder
} from '@prisma/client';
const yahooFinance = require('yahoo-finance2').default;
import Big from 'big.js';
import { endOfToday, isAfter } from 'date-fns';
import { groupBy } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { Activity } from './interfaces/activities.interface';
const axios = require('axios');

@Injectable()
export class OrderService {
  public constructor(
    private readonly accountService: AccountService,
    private readonly dataGatheringService: DataGatheringService,
    private readonly exchangeRateDataService: ExchangeRateDataService,
    private readonly prismaService: PrismaService,
    private readonly symbolProfileService: SymbolProfileService
  ) { }

  public async order(
    orderWhereUniqueInput: Prisma.OrderWhereUniqueInput
  ): Promise<Order | null> {
    return this.prismaService.order.findUnique({
      where: orderWhereUniqueInput
    });
  }

  public async orders(params: {
    include?: Prisma.OrderInclude;
    skip?: number;
    take?: number;
    cursor?: Prisma.OrderWhereUniqueInput;
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }): Promise<OrderWithAccount[]> {
    const { include, skip, take, cursor, where, orderBy } = params;

    return this.prismaService.order.findMany({
      cursor,
      include,
      orderBy,
      skip,
      take,
      where
    });
  }

  public async ordersWithCount(params: {
    include?: Prisma.OrderInclude;
    skip?: number;
    take?: number;
    cursor?: Prisma.OrderWhereUniqueInput;
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }): Promise<{ orders: OrderWithAccount[], count: number }> {
    const { include, skip, take, cursor, where, orderBy } = params;

    const [orders, count] = await this.prismaService.$transaction([
      this.prismaService.order.findMany({
        cursor,
        include,
        orderBy,
        skip,
        take,
        where
      }),
      this.prismaService.order.count({ where })
    ]);

    return { orders, count };
  }

  public async createOrder(
    data: Prisma.OrderCreateInput & {
      accountId?: string;
      assetClass?: AssetClass;
      assetSubClass?: AssetSubClass;
      currency?: string;
      dataSource?: DataSource;
      symbol?: string;
      tags?: Tag[];
      userId: string;
    }
  ): Promise<Order> {
    const defaultAccount = (
      await this.accountService.getAccounts(data.userId)
    ).find((account) => {
      return account.isDefault === true;
    });

    const tags = data.tags ?? [];

    let Account = {
      connect: {
        id_userId: {
          userId: data.userId,
          id: data.accountId ?? defaultAccount?.id
        }
      }
    };

    if (data.type === 'ITEM') {
      const assetClass = data.assetClass;
      const assetSubClass = data.assetSubClass;
      const currency = data.SymbolProfile.connectOrCreate.create.currency;
      const dataSource: DataSource = 'MANUAL';
      const id = uuidv4();
      const name = data.SymbolProfile.connectOrCreate.create.symbol;

      Account = undefined;
      data.id = id;
      data.SymbolProfile.connectOrCreate.create.assetClass = assetClass;
      data.SymbolProfile.connectOrCreate.create.assetSubClass = assetSubClass;
      data.SymbolProfile.connectOrCreate.create.currency = currency;
      data.SymbolProfile.connectOrCreate.create.dataSource = dataSource;
      data.SymbolProfile.connectOrCreate.create.name = name;
      data.SymbolProfile.connectOrCreate.create.symbol = id;
      data.SymbolProfile.connectOrCreate.where.dataSource_symbol = {
        dataSource,
        symbol: id
      };
    } else {
      data.SymbolProfile.connectOrCreate.create.symbol =
        data.SymbolProfile.connectOrCreate.create.symbol.toUpperCase();
    }

    await this.dataGatheringService.addJobToQueue(
      GATHER_ASSET_PROFILE_PROCESS,
      {
        dataSource: data.SymbolProfile.connectOrCreate.create.dataSource,
        symbol: data.SymbolProfile.connectOrCreate.create.symbol
      },
      GATHER_ASSET_PROFILE_PROCESS_OPTIONS
    );

    const isDraft = isAfter(data.date as Date, endOfToday());

    if (!isDraft) {
      // Gather symbol data of order in the background, if not draft
      await this.dataGatheringService.gatherSymbols([
        {
          dataSource: data.SymbolProfile.connectOrCreate.create.dataSource,
          date: <Date>data.date,
          symbol: data.SymbolProfile.connectOrCreate.create.symbol
        }
      ]);
    }


    delete data.accountId;
    delete data.assetClass;
    delete data.assetSubClass;

    if (!data.comment) {
      delete data.comment;
    }

    if (!(data.type === 'ITEM')) {

      // Getting summaryDetail for given symbol.
      const symbolDetail = await this.getSymbolDetail(data.symbol)
      // Logic for dividendpershare_at_cost
      if (!(symbolDetail)) {
        // If symbolDetail is null then dividendpershare_at_cost = 0.0.
        data['dividendpershare_at_cost'] = 0.0;
      } else {
        // dividendpershare_at_cost getting from function
        data['dividendpershare_at_cost'] = await this.dataGatheringService.getDividendpershareAtCost(data.symbol, data.date);
      }

      //   Set Historical Dividend Data for given symbol.
      //   DividendData table's entry goes from this call.
      await this.setHistoricalDividendData(data.symbol);

      // SplitData table's entry goes fron this call
      await this.setEODHistoricalSplitData(data.symbol);
    }

    delete data.currency;
    delete data.dataSource;
    delete data.symbol;
    delete data.tags;
    delete data.userId;

    const orderData: Prisma.OrderCreateInput = data;

    // Creating order table entry.
    return this.prismaService.order.create({
      data: {
        ...orderData,
        Account,
        isDraft,
        tags: {
          connect: tags.map(({ id }) => {
            return { id };
          })
        }
      }
    });
  }


  public async setHistoricalDividendData(symbol: string) {
    const data = await this.getHistoricalDividendData(symbol);


    if (data && (data.length > 0)) {
      const finalDividendData = []
      for (let i = 0; i < data.length; i++) {

        const obj = {
          dataSource: 'EOD_HISTORICAL_DATA',
          symbol,
          value: data[i]['value'],
          unadjusted_value: data[i]['unadjustedValue'],
          date: (data[i]['paymentDate']) ? (data[i]['paymentDate']) : (data[i]['date']),
          currency: data[i]['currency'],
          declarationDate: (data[i]['declarationDate']) ? new Date((data[i]['declarationDate'])) : null,
          paymentDate: (data[i]['paymentDate']) ? new Date((data[i]['paymentDate'])) : null,
          recordDate: (data[i]['recordDate']) ? new Date((data[i]['recordDate'])) : null,
        }

        obj['date'] = new Date(obj['date']);

        finalDividendData.push(obj);

      }

      const isDividendDataExist = await this.prismaService.dividendData.findFirst({
        where: {
          symbol
        }
      })

      if (!(isDividendDataExist)) {

        await this.prismaService.dividendData.createMany({
          data: [
            ...finalDividendData
          ],
          skipDuplicates: true,
        })
        Logger.log(`DividendData is Inserted for ${symbol} !`);

      } else {

        await this.prismaService.dividendData.deleteMany({
          where: {
            symbol: symbol
          }
        })

        await this.prismaService.dividendData.createMany({
          data: [
            ...finalDividendData
          ],
          skipDuplicates: true,
        })
        Logger.log(`DividendData is Updated for ${symbol} !`);


      }

    }

  }

  public async getHistoricalDividendData(symbol) {
    try {

      const url = `https://eodhistoricaldata.com/api/div/${symbol}?fmt=json&from=2000-01-01&api_token=633b608e2acf44.53707275`
      const response = await axios.get(url)
      return response.data;

    } catch (error) {
      return undefined;
    }
  }

  public async getSymbolDetail(symbol) {

    try {
      const queryOptions = { modules: ['price', 'summaryDetail'] }; // defaults

      const response = await yahooFinance.quoteSummary(symbol, queryOptions);
      return response;

    } catch (error) {
      console.log(error);
      return undefined;
    }

  }

  public async setEODHistoricalSplitData(symbol: string) {
    if (!symbol) return;
    const data = await this.getHistoricalSplitData(symbol);
    const splitData = [];
    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const obj: Prisma.SplitDataCreateInput = {
          dataSource: 'EOD_HISTORICAL_DATA',
          symbol,
          date: new Date(data[i]['date']),
          split: data[i]['split'],
        }
        splitData.push(obj);
      }
    }
    const isSplitDataExist = await this.prismaService.splitData.findMany({
      where: {
        symbol
      }
    })

    if (isSplitDataExist && isSplitDataExist.length > 0) {

      if ((isSplitDataExist && isSplitDataExist.length) < (splitData && splitData.length)) {

        await this.prismaService.splitData.createMany({
          data: [
            ...splitData
          ],
          skipDuplicates: true,
        })
        Logger.log(`SplitData is Updated for ${symbol} !`);

      } else {
        Logger.log(`SplitData is Already Up to date for ${symbol} !`);
      }

    } else {

      if (splitData && splitData.length > 0) {

        await this.prismaService.splitData.createMany({
          data: [...splitData],
          skipDuplicates: true,
        })
        Logger.log(`SplitData is Inserted for ${symbol} !`);
      } else {
        Logger.log(`SplitData is Not Found for ${symbol} !`);
      }


    }


  }


  public async getHistoricalSplitData(symbol) {
    try {
      const url = `https://eodhistoricaldata.com/api/splits/${symbol}?fmt=json&from=2000-01-01&api_token=633b608e2acf44.53707275`
      const response = await axios.get(url)
      return response.data;

    } catch (error) {
      return undefined;
    }
  }


  public async deleteOrder(
    where: Prisma.OrderWhereUniqueInput
  ): Promise<Order> {
    const order = await this.prismaService.order.delete({
      where
    });

    if (order.type === 'ITEM') {
      await this.symbolProfileService.deleteById(order.symbolProfileId);
    }

    return order;
  }

  public async getOrdersWithPagination({
    filters,
    includeDrafts = false,
    types,
    userCurrency,
    userId,
    withExcludedAccounts = false,
    page = '0',
    pageSize = '2',
    orderBy = 'date',
    direction = 'desc'
  }: {
    filters?: Filter[];
    includeDrafts?: boolean;
    types?: TypeOfOrder[];
    userCurrency: string;
    userId: string;
    withExcludedAccounts?: boolean;
    page?: string;
    pageSize?: string;
    orderBy?: string;
    direction?: string;
  }): Promise<{ activities: Activity[], count: number }> {
    const where: Prisma.OrderWhereInput = { userId };

    const {
      ACCOUNT: filtersByAccount,
      ASSET_CLASS: filtersByAssetClass,
      TAG: filtersByTag
    } = groupBy(filters, (filter) => {
      return filter.type;
    });

    if (filtersByAccount?.length > 0) {
      where.accountId = {
        in: filtersByAccount.map(({ id }) => {
          return id;
        })
      };
    }

    if (includeDrafts === false) {
      where.isDraft = false;
    }

    if (filtersByAssetClass?.length > 0) {
      where.SymbolProfile = {
        OR: [
          {
            AND: [
              {
                OR: filtersByAssetClass.map(({ id }) => {
                  return { assetClass: AssetClass[id] };
                })
              },
              {
                OR: [
                  { SymbolProfileOverrides: { is: null } },
                  { SymbolProfileOverrides: { assetClass: null } }
                ]
              }
            ]
          },
          {
            SymbolProfileOverrides: {
              OR: filtersByAssetClass.map(({ id }) => {
                return { assetClass: AssetClass[id] };
              })
            }
          }
        ]
      };
    }

    if (filtersByTag?.length > 0) {
      where.tags = {
        some: {
          OR: filtersByTag.map(({ id }) => {
            return { id };
          })
        }
      };
    }

    if (types) {
      where.OR = types.map((type) => {
        return {
          type: {
            equals: type
          }
        };
      });
    }

    const sortOptions = {};
    sortOptions[orderBy] = direction;

    const { orders, count } = await this.ordersWithCount({
      where,
      skip: parseInt(page, 10) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
      include: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Account: {
          include: {
            Platform: true
          }
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SymbolProfile: true,
        tags: true
      },
      orderBy: sortOptions,
    });

    const activities = orders
      .filter((order) => {
        return withExcludedAccounts || order.Account?.isExcluded === false;
      })
      .map((order) => {
        let value = new Big(order.quantity).mul(order.unitPrice).toNumber();

        if (order['SymbolProfile']['assetSubClass'] === 'DERIVATIVES') {
          value = new Big(order.quantity).mul(100).mul(order.unitPrice).toNumber();
        }


        return {
          ...order,
          value,
          feeInBaseCurrency: this.exchangeRateDataService.toCurrency(
            order.fee,
            (order.SymbolProfile?.currency) ? (order.SymbolProfile?.currency) : null,
            userCurrency
          ),
          valueInBaseCurrency: this.exchangeRateDataService.toCurrency(
            value,
            (order.SymbolProfile?.currency) ? (order.SymbolProfile?.currency) : null,
            userCurrency
          )
        };
      });
    return { activities, count };
  }

  public async getOrders({
    filters,
    includeDrafts = false,
    types,
    userCurrency,
    userId,
    withExcludedAccounts = false
  }: {
    filters?: Filter[];
    includeDrafts?: boolean;
    types?: TypeOfOrder[];
    userCurrency: string;
    userId: string;
    withExcludedAccounts?: boolean;
  }): Promise<Activity[]> {
    const where: Prisma.OrderWhereInput = { userId };

    const {
      ACCOUNT: filtersByAccount,
      ASSET_CLASS: filtersByAssetClass,
      TAG: filtersByTag
    } = groupBy(filters, (filter) => {
      return filter.type;
    });

    if (filtersByAccount?.length > 0) {
      where.accountId = {
        in: filtersByAccount.map(({ id }) => {
          return id;
        })
      };
    }

    if (includeDrafts === false) {
      where.isDraft = false;
    }

    if (filtersByAssetClass?.length > 0) {
      where.SymbolProfile = {
        OR: [
          {
            AND: [
              {
                OR: filtersByAssetClass.map(({ id }) => {
                  return { assetClass: AssetClass[id] };
                })
              },
              {
                OR: [
                  { SymbolProfileOverrides: { is: null } },
                  { SymbolProfileOverrides: { assetClass: null } }
                ]
              }
            ]
          },
          {
            SymbolProfileOverrides: {
              OR: filtersByAssetClass.map(({ id }) => {
                return { assetClass: AssetClass[id] };
              })
            }
          }
        ]
      };
    }

    if (filtersByTag?.length > 0) {
      where.tags = {
        some: {
          OR: filtersByTag.map(({ id }) => {
            return { id };
          })
        }
      };
    }

    if (types) {
      where.OR = types.map((type) => {
        return {
          type: {
            equals: type
          }
        };
      });
    }

    return (
      await this.orders({
        where,
        include: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Account: {
            include: {
              Platform: true
            }
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          SymbolProfile: true,
          tags: true
        },
        orderBy: { date: 'asc' }
      })
    )
      .filter((order) => {
        return withExcludedAccounts || order.Account?.isExcluded === false;
      })
      .map((order) => {
        const value = new Big(order.quantity).mul(order.unitPrice).toNumber();

        return {
          ...order,
          value,
          feeInBaseCurrency: this.exchangeRateDataService.toCurrency(
            order.fee,
            (order.SymbolProfile?.currency) ? (order.SymbolProfile?.currency) : null,
            userCurrency
          ),
          valueInBaseCurrency: this.exchangeRateDataService.toCurrency(
            value,
            (order.SymbolProfile?.currency) ? (order.SymbolProfile?.currency) : null,
            userCurrency
          )
        };
      });
  }

  public async updateOrder({
    data,
    where
  }: {
    data: Prisma.OrderUpdateInput & {
      assetClass?: AssetClass;
      assetSubClass?: AssetSubClass;
      currency?: string;
      dataSource?: DataSource;
      symbol?: string;
      tags?: Tag[];
    };
    where: Prisma.OrderWhereUniqueInput;
  }): Promise<Order> {
    if (data.Account.connect.id_userId.id === null) {
      delete data.Account;
    }

    if (!data.comment) {
      data.comment = null;
    }

    const tags = data.tags ?? [];

    let isDraft = false;

    if (data.type === 'ITEM') {
      delete data.SymbolProfile.connect;
    } else {
      delete data.SymbolProfile.update;

      isDraft = isAfter(data.date as Date, endOfToday());

      if (!isDraft) {
        // Gather symbol data of order in the background, if not draft
        this.dataGatheringService.gatherSymbols([
          {
            dataSource: data.SymbolProfile.connect.dataSource_symbol.dataSource,
            date: <Date>data.date,
            symbol: data.SymbolProfile.connect.dataSource_symbol.symbol
          }
        ]);
      }
    }

    delete data.assetClass;
    delete data.assetSubClass;
    delete data.currency;
    delete data.dataSource;
    delete data.symbol;
    delete data.tags;

    return this.prismaService.order.update({
      data: {
        ...data,
        isDraft,
        tags: {
          connect: tags.map(({ id }) => {
            return { id };
          })
        }
      },
      where
    });
  }
}
