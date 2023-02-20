import { SymbolProfileService } from '@ghostfolio/api/services/symbol-profile.service';
import {
  DATA_GATHERING_QUEUE,
  GATHER_HISTORICAL_MARKET_DATA_PROCESS,
  GATHER_HISTORICAL_MARKET_DATA_PROCESS_OPTIONS,
  QUEUE_JOB_STATUS_LIST
} from '@ghostfolio/common/config';
import { DATE_FORMAT, resetHours } from '@ghostfolio/common/helper';
import { UniqueAsset } from '@ghostfolio/common/interfaces';
import { RequestWithUser } from '@ghostfolio/common/types';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource, PlaidHoldings, Prisma, PrismaClient, SplitData } from '@prisma/client';
import { JobOptions, Queue } from 'bull';
import { format, getDate, getMonth, getYear, isBefore, parseISO, subDays } from 'date-fns';
import { OrderService } from '../app/order/order.service';
import { PlaidService } from '../app/plaid/plaid.service';
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;
import { DataProviderService } from './data-provider/data-provider.service';
import { DataEnhancerInterface } from './data-provider/interfaces/data-enhancer.interface';
import { ExchangeRateDataService } from './exchange-rate-data.service';
import { IDataGatheringItem } from './interfaces/interfaces';
import { MarketDataService } from './market-data.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class DataGatheringService {

  public PLAID_BASE_URI = process.env.PLAID_BASE_URI;
  public PLAID_CLIENT_ID = process.env.CLIENT_ID;
  public PLAID_SECRET_ID = process.env.SECRET_ID;

  public constructor(
    @Inject('DataEnhancers')
    private readonly dataEnhancers: DataEnhancerInterface[],
    @InjectQueue(DATA_GATHERING_QUEUE)
    private readonly dataGatheringQueue: Queue,
    private readonly dataProviderService: DataProviderService,
    private readonly exchangeRateDataService: ExchangeRateDataService,
    private readonly marketDataService: MarketDataService,
    private readonly prismaService: PrismaService,
    private readonly symbolProfileService: SymbolProfileService,
  ) { }

  public async addJobToQueue(name: string, data: any, options?: JobOptions) {
    const hasJob = await this.hasJob(name, data);

    if (hasJob) {
      Logger.log(
        `Job ${name} with data ${JSON.stringify(data)} already exists.`,
        'DataGatheringService'
      );
    } else {
      return this.dataGatheringQueue.add(name, data, options);
    }
  }

  public async gatherDividendData() {
    const symbols = await this.prismaService.symbolProfile.findMany({
      where: {
      },
      select: {
        symbol: true
      }
    })

    symbols.map(async ({ symbol }) => {
      await this.setHistoricalDividendData(symbol);
    })

  }

  public async gatherSplitData() {
    const symbols = await this.prismaService.symbolProfile.findMany({
      where: {
      },
      select: {
        symbol: true
      }
    })

    symbols.map(async ({ symbol }) => {
      await this.setEODHistoricalSplitData(symbol);
    })
  }

  public async getSymbolProfileId(symbol,isCCNSymbol) {
    try {

      const isSymbol = await this.prismaService.symbolProfile.findFirst({
        where: {
          symbol,
        }
      })

      if (isSymbol) {
        return isSymbol.id;
      } else {

        const newSymbol = await this.prismaService.symbolProfile.create({
          data: {
            symbol,
            currency: 'USD',
            dataSource: 'YAHOO',
            assetClass:isCCNSymbol? 'EQUITY':null,
            assetSubClass: isCCNSymbol ? 'DERIVATIVES':null
          }
        })

        return newSymbol.id;
      }

    } catch (error) {

      return null;

    }
  }

  public async setEODHistoricalSplitData(symbol: string) {
    if (!symbol) return;
    try {


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
    } catch (error) {
      console.log(error);
    }

  }

  public async setHistoricalDividendData(symbol: string) {

    try {

      const data = await this.getHistoricalDividendData(symbol);

      if (data && (data.length > 0)) {
        let finalDividendData = []
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

        const isDividendDataExist = await this.prismaService.dividendData.findMany({
          where: {
            symbol
          }
        })

        if (isDividendDataExist && isDividendDataExist.length !== 0) {


          if (isDividendDataExist.length < finalDividendData.length) {


            isDividendDataExist.map((e) => {

              const date = format(new Date(e['date']), 'yyyy-MM-dd')
              finalDividendData = finalDividendData.filter((e1) => date !== e1['date'])

            })

            await this.prismaService.dividendData.createMany({
              data: [
                ...finalDividendData
              ],
              skipDuplicates: true,
            })
            Logger.log(`DividendData is Updated for ${symbol} !`);

          } else {

            Logger.log(`DividendData is Already Up to date for ${symbol} !`);

          }



        } else {

          await this.prismaService.dividendData.createMany({
            data: [
              ...finalDividendData
            ],
            skipDuplicates: true,
          })
          Logger.log(`DividendData is Inserted for ${symbol} !`);


        }

      }

    } catch (error) {
      console.log(error);

    }

  }

  public async gatherHistoricalMarketData(data) {
    try {
      const { dataSource, date, symbol } = data;

      const historicalData = await this.dataProviderService.getHistoricalRaw(
        [{ dataSource, symbol }],
        parseISO(<string>(<unknown>date)),
        new Date()
      );

      let currentDate = parseISO(<string>(<unknown>date));
      let lastMarketPrice: number;

      while (
        isBefore(
          currentDate,
          new Date(
            Date.UTC(
              getYear(new Date()),
              getMonth(new Date()),
              getDate(new Date()),
              0
            )
          )
        )
      ) {
        if (
          historicalData[symbol]?.[format(currentDate, DATE_FORMAT)]
            ?.marketPrice
        ) {
          lastMarketPrice =
            historicalData[symbol]?.[format(currentDate, DATE_FORMAT)]
              ?.marketPrice;
        }

        if (lastMarketPrice) {
          try {
            await this.prismaService.marketData.create({
              data: {
                dataSource,
                symbol,
                date: new Date(
                  Date.UTC(
                    getYear(currentDate),
                    getMonth(currentDate),
                    getDate(currentDate),
                    0
                  )
                ),
                marketPrice: lastMarketPrice
              }
            });
          } catch { }
        }

        // Count month one up for iteration
        currentDate = new Date(
          Date.UTC(
            getYear(currentDate),
            getMonth(currentDate),
            getDate(currentDate) + 1,
            0
          )
        );
      }

      Logger.log(
        `Historical market data gathering has been completed for ${symbol} (${dataSource}).`,
        `DataGatheringProcessor (${GATHER_HISTORICAL_MARKET_DATA_PROCESS})`
      );
    } catch (error) {
      Logger.error(
        error,
        `DataGatheringProcessor (${GATHER_HISTORICAL_MARKET_DATA_PROCESS})`
      );

      // throw new Error(error);
    }
  }


  public async gather7Days() {
    try {

      const dataGatheringItems = await this.getSymbols7D();
      await this.gatherSymbols(dataGatheringItems);
    } catch (error) {
      console.log(error);

    }
  }

  public async gatherMax() {
    const dataGatheringItems = await this.getSymbolsMax();
    await this.gatherSymbols(dataGatheringItems);
  }

  public async gatherSymbol({ dataSource, symbol }: UniqueAsset) {
    await this.marketDataService.deleteMany({ dataSource, symbol });

    const symbols = (await this.getSymbolsMax()).filter((dataGatheringItem) => {
      return (
        dataGatheringItem.dataSource === dataSource &&
        dataGatheringItem.symbol === symbol
      );
    });
    await this.gatherSymbols(symbols);
  }

  public isDate15MonthOld(date) {
    date = new Date(date)
    let months;
    const d2 = new Date()
    months = (d2.getFullYear() - date.getFullYear()) * 12;
    months -= date.getMonth();
    months += d2.getMonth();
    return ((months > 15) ? true : false);
  }

  public async gatherSymbolForDate({
    dataSource,
    date,
    symbol
  }: {
    dataSource: DataSource;
    date: Date;
    symbol: string;
  }) {
    try {
      const historicalData = await this.dataProviderService.getHistoricalRaw(
        [{ dataSource, symbol }],
        date,
        date
      );

      const marketPrice =
        historicalData[symbol][format(date, DATE_FORMAT)].marketPrice;

      if (marketPrice) {
        return await this.prismaService.marketData.upsert({
          create: {
            dataSource,
            date,
            marketPrice,
            symbol
          },
          update: { marketPrice },
          where: { date_symbol: { date, symbol } }
        });
      }
    } catch (error) {
      Logger.error(error, 'DataGatheringService');
    } finally {
    }
  }

  public async gatherAssetProfiles(aUniqueAssets?: UniqueAsset[]) {

    try {


      let uniqueAssets = aUniqueAssets?.filter((dataGatheringItem) => {
        return dataGatheringItem.dataSource !== 'MANUAL';
      });

      if (!uniqueAssets) {
        uniqueAssets = await this.getUniqueAssets();
      }

      const assetProfiles = await this.dataProviderService.getAssetProfiles(
        uniqueAssets
      );
      const symbolProfiles =
        await this.symbolProfileService.getSymbolProfilesBySymbols(
          uniqueAssets.map(({ symbol }) => {
            return symbol;
          })
        );

      for (const [symbol, assetProfile] of Object.entries(assetProfiles)) {
        const symbolMapping = symbolProfiles.find((symbolProfile) => {
          return symbolProfile.symbol === symbol;
        })?.symbolMapping;

        for (const dataEnhancer of this.dataEnhancers) {
          try {
            assetProfiles[symbol] = await dataEnhancer.enhance({
              response: assetProfile,
              symbol: symbolMapping?.[dataEnhancer.getName()] ?? symbol
            });
          } catch (error) {
            Logger.error(
              `Failed to enhance data for symbol ${symbol} by ${dataEnhancer.getName()}`,
              error,
              'DataGatheringService'
            );
          }
        }

        const {
          assetClass,
          assetSubClass,
          countries,
          currency,
          dataSource,
          name,
          sectors,
          url
        } = assetProfiles[symbol];

        if (!(currency) || !(dataSource)) {
          continue;
        }

        // Gather Historical Dividend data for handling dividendpershare and type.
        const data = await this.getHistoricalDividendData(symbol);

        let dividendpershare = null;
        let dividendpershare_type = null;

        // Getting Yahoo Quotes Summary details.
        const { summaryDetail } = await this.getSymbolDetail(symbol);

        // Calculation of dividendpershare & dividendpershare_type logic 
        if (!(summaryDetail)) {
          // If not summaryDetail then dividendpershare & dividendpershare_type is null.
          dividendpershare = null;
          dividendpershare_type = null;
        } else {
          // dividendpershare = dividendRate, else search for trailingAnnualDividendRate otherwise null.
          dividendpershare = summaryDetail['dividendRate'] ? summaryDetail['dividendRate'] :
            (summaryDetail['trailingAnnualDividendRate']) ? summaryDetail['trailingAnnualDividendRate'] : null;

          //dividendpershare_type = 1,when dividendRate exist else 0.
          // dividendpershare_type = 0,when trailingAnnualDividendRate exist else null.
          dividendpershare_type = summaryDetail['dividendRate'] ? 1 : (summaryDetail['trailingAnnualDividendRate']) ? 0 : null;
        }



        let dividend = 0;
        // This is dataSource2 for EOD_HISTORICAL_DATA
        const dataSource2 = {
          source1: 'EOD_HISTORICAL_DATA'
        }
        let dividend_period = null;

        // Logic for dividend & dividend_period calculation
        if (!(data)) {
          dividend = 0;
        } else if (data && data.length === 0) {
          dividend = 0;
        } else {
          dividend = 1;
          dividend_period = data[data.length - 1]['period'] ? data[data.length - 1]['period'] : null;

          // If dividend_period is null then logic to set dividend_period & dividend. 
          if (!(dividend_period)) {

            // If latest date is older than 15 Months then dividend_period = null & dividend = 0
            // else calculate dividend_period
            if (this.isDate15MonthOld(data[data.length - 1]['date'])) {
              dividend_period = null;
              dividend = 0;
            } else {
              // else calculate dividend_period
              dividend_period = this.calculatePeriod(data);
            }

          }

        }

        //    Check if dividend is 1 & dividendpershare is null then logic for calculation of dividendpershare_type & dividendpershare
        if (dividend === 1 && (!(dividendpershare))) {

          dividendpershare_type = 0;

          if (data[data.length - 1]['period'] === "Monthly") {
            dividendpershare = data[data.length - 1]['value'] * 12;
          }

          if (data[data.length - 1]['period'] === "Quarterly") {
            dividendpershare = data[data.length - 1]['value'] * 4;
          }

          if (data[data.length - 1]['period'] === "SemiAnnual") {
            dividendpershare = data[data.length - 1]['value'] * 2;
          }

          if (data[data.length - 1]['period'] === "Annual") {
            dividendpershare = data[data.length - 1]['value'] * 1;
          }


        }

        if (dividend === 0 && dividendpershare != null) {
          dividend = 1;
          dividend_period = 'Other'
        }


        try {
          await this.prismaService.symbolProfile.upsert({
            create: {
              assetClass,
              assetSubClass,
              countries,
              currency,
              dataSource,
              dividend,
              dataSource2,
              dividend_period,
              name,
              sectors,
              symbol,
              dividendpershare,
              dividendpershare_type,
              url
            },
            update: {
              assetClass,
              assetSubClass,
              countries,
              dividend,
              dataSource2,
              dividendpershare,
              dividendpershare_type,
              dividend_period,
              currency,
              name,
              sectors,
              url
            },
            where: {
              dataSource_symbol: {
                dataSource,
                symbol
              }
            }
          });
        } catch (error) {
          Logger.error(
            `${symbol}: ${error?.meta?.cause}`,
            error,
            'DataGatheringService'
          );
        }
      }

      Logger.log(
        `Asset profile data gathering has been completed for ${uniqueAssets
          .map(({ dataSource, symbol }) => {
            return `${symbol} (${dataSource})`;
          })
          .join(',')}.`,
        'DataGatheringService'
      );


    } catch (error) {
      console.log(error);
    }

  }

  public async getSymbolDetail(symbol) {

    try {
      const queryOptions = { modules: ['price', 'summaryDetail'] }; // defaults

      const response = await yahooFinance.quoteSummary(symbol, queryOptions);
      return response;

    } catch (error) {
      console.log(error);
      return { summaryDetail: null };
    }

  }

  public calculatePeriod(data) {

    if (data) {
      const latestYear = data[data.length - 1]['date'].substring(0, 4);
      let latestYearCount = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i].date.startsWith(latestYear)) {
          latestYearCount++;
        }
      }
      let flag = 'other';
      switch (latestYearCount) {
        case 12: flag = 'monthly'; break;
        case 4: flag = 'quarterly'; break;
        case 2: flag = 'SemiAnnual'; break;
        case 1: flag = 'annual'; break;
        default:
          flag = 'other'; break;
      }
      return flag;
    } else {
      return "other"
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

  public async getHistoricalSplitData(symbol) {
    try {
      const url = `https://eodhistoricaldata.com/api/splits/${symbol}?fmt=json&from=2000-01-01&api_token=633b608e2acf44.53707275`
      const response = await axios.get(url)
      return response.data;

    } catch (error) {
      return undefined;
    }
  }

  public async investmentsHoldingsGet(access_token: string) {
    if (!access_token) return null;

    const data = JSON.stringify({
      "client_id": this.PLAID_CLIENT_ID,
      "secret": this.PLAID_SECRET_ID,
      "access_token": access_token
    });

    const config = {
      method: 'post',
      url: this.PLAID_BASE_URI + `/investments/holdings/get`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: data
    };

    try {
      const response = await axios(config)
      return response.data;
    } catch (error) {
      return null;
    }
  }


  public async handleUpdateHoldingsInvestment(access_token) {

    try {

      if (!(access_token)) return;

      const data = await this.investmentsHoldingsGet(access_token);

      if (data) {

        const investmentAccountId = [];
        const accounts = data['accounts'] ? data['accounts'] : null;

        if (!(accounts)) return;

        for (let i = 0; i < accounts.length; i++) {
          if (accounts[i] && accounts[i]['type'] === 'investment') {
            investmentAccountId.push(accounts[i]['account_id']);
          }
        }

        const plaidHolding = []; // This is final data that to be inserted into Database.

        let holdings = []
        let securities = null;

        for (let i = 0; i < investmentAccountId.length; i++) {
          holdings = data.holdings.filter((e) => e.account_id === investmentAccountId[i])

          for (let j = 0; j < holdings.length; j++) {

            securities = data.securities.filter((e) => (e.security_id === holdings[j]['security_id']))

            const obj = {
              symbol: securities[0].ticker_symbol,
              security_id: securities[0].security_id,
              currency: holdings[j]['iso_currency_code'],
              quantity: holdings[j]['quantity'],
              cost_basis: holdings[j]['cost_basis'],
              name: securities[0].name,
              is_cash_equivalent: securities[0]['is_cash_equivalent'],
              accountId: 'Account table primary key here',
              accountUserId: 'Account UserId primary key here',
              lastUpdated: new Date(),
              symbolProfileId: null,
              account_id: holdings[j]['account_id']
            }

            plaidHolding.push(obj);

          }


        }

        for (let i = 0; i < plaidHolding.length; i++) {

          const { account_id } = plaidHolding[i];

          // const { id, userId } = getAccountByAccount_id(account_id);
          try {

            const { id, userId } = await this.prismaService.account.findFirst({
              where: {
                account_id
              }
            })

            plaidHolding[i]['accountId'] = id;
            plaidHolding[i]['accountUserId'] = userId;

          } catch (error) {
            console.log("Could not find Account for account_id = ", account_id + " in account table!");
          }

          delete plaidHolding[i]['account_id'];

          if (plaidHolding[i]['symbol']) {

            let symbolProfile = null;
            try {


              symbolProfile = await this.prismaService.symbolProfile.findFirst({
                where: {
                  symbol: plaidHolding[i]['symbol'],
                  dataSource: 'YAHOO'
                }
              })

              if (!(symbolProfile)) {
                // If symbol not exist then creating 
                console.log("Creating symbol --->", plaidHolding[i]['symbol']);
                symbolProfile = await this.prismaService.symbolProfile.create({
                  data: {
                    symbol: plaidHolding[i]['symbol'],
                    currency: 'USD',
                    dataSource: 'YAHOO'
                  }
                })
              }

            } catch (error) {
              console.log(error);
            }

            try {
              // await this.gatherHistoricalMarketData(plaidHolding[i]['symbol']);
              //   Set Historical Dividend Data for given symbol.
              //   DividendData table's entry goes from this call.
              await this.setHistoricalDividendData(plaidHolding[i]['symbol']);
              // SplitData table's entry goes fron this call
              await this.setEODHistoricalSplitData(plaidHolding[i]['symbol']);
              // SymbolProfile Entry
              await this.gatherAssetProfiles([{ dataSource: 'YAHOO', symbol: plaidHolding[i]['symbol'] }])


            } catch (error) {
              console.log('getting error');
              console.log(error);
            }
            plaidHolding[i]['symbolProfileId'] = symbolProfile['id'];

          }

        }
        try {

          for (let i = 0; i < plaidHolding.length; i++) {

            const { security_id, name, symbol, currency, quantity, cost_basis, is_cash_equivalent,
              accountId, accountUserId, lastUpdated, symbolProfileId } = plaidHolding[i];

            try {


              await this.prismaService.plaidHoldings.upsert({
                create: {
                  accountId, security_id, symbol, currency, quantity, cost_basis, is_cash_equivalent,
                  accountUserId, lastUpdated, symbolProfileId, name
                },
                update: {
                  accountId, security_id, symbol, currency, quantity, cost_basis, is_cash_equivalent,
                  accountUserId, lastUpdated, symbolProfileId, name
                },
                where: {
                  accountId_security_id: {
                    accountId,
                    security_id,
                  }
                },
              })

            } catch (error) {
              console.log("Upsert Error");
              console.log(error);


            }

          }

          // Sync Cash Balance for Plaid-linked Investment Type Accounts based on PlaidHoldings table
          await this.syncCashBalanceForPlaidLinkedInvestment(plaidHolding, access_token);

          // For market Data
          await this.gather7Days();

        } catch (error) {
          console.log('getting error');

        }

      } else {
        console.log('data is null');
      }


    } catch (error) {
      console.log(error);

    }


  }

  public async syncCashBalanceForPlaidLinkedInvestment(data, access_token) {
    console.log('syncCashBalanceForPlaidLinkedInvestment started...');
    try {

      data = data.filter((e) => e.is_cash_equivalent)

      const set = new Set<string>()

      data.map(e => set.add(e.accountId));

      const plaidToken = await this.prismaService.plaidToken.findFirst({
        where: {
          accessToken: access_token
        }
      })

      if (!plaidToken) {
        return;
      }

      const userId = plaidToken.userId;
      for (const item of set.values()) {

        const accountId: string = item;

        let sum = 0;
        const temp = data.filter((e) => e.accountId === accountId)
        temp.forEach((e) => sum += e.quantity);

        await this.prismaService.account.update({
          where: {
            id_userId: {
              id: accountId,
              userId: userId
            }
          },
          data: {
            balance: sum
          }
        })


      }


    } catch (error) {
      console.log(error);

    }


    console.log('syncCashBalanceForPlaidLinkedInvestment Ended...');
  }

  public async getDividendpershareAtCost(symbol, actionDate) {
    if (!(symbol)) return 0.0;

    // Getting HistoricalDividendData for given symbol & storing in it response variable.
    // response = HistoricalDividendData.
    let response = await this.getHistoricalDividendData(symbol);
    let dividendpershare_at_cost = 0.0;
    let lastPeriod = null;
    if (response && response.length >= 1) {
      lastPeriod = response[response.length - 1]['period'] ? response[response.length - 1]['period'] : { period: '' }
    }

    // Logic for dividendpershare_at_cost
    if (!(response)) {
      // If HistoricalDividendData is null or undefined then dividendpershare_at_cost is null.
      dividendpershare_at_cost = null;
    }
    else if (lastPeriod === "Quarterly" && response.length < 4) {
      dividendpershare_at_cost = response[response.length - 1]['value'] * 4;
    }
    else if (lastPeriod === "SemiAnnual" && response.length < 2) {
      dividendpershare_at_cost = response[response.length - 1]['value'] * 2;
    }
    else if (lastPeriod === "Monthly" && response.length < 12) {
      dividendpershare_at_cost = response[response.length - 1]['value'] * 12;
    }
    else if (response && response.length > 1) {

      // frontendDate = A date which is Stock Buy, Sell or Dividend .
      // Add Activity form contains this frontendDate.
      const frontendDate = format(new Date(actionDate), 'yyyy-MM-dd')
      // Getting HistoricalDividendData only lesser than or equal to frontendDate.
      response = response.filter((value) => value['date'] <= frontendDate)
      // Getting period of last record or dividend release after frontendDate filteration.
      const { period } = (response[response.length - 1]) ? (response[response.length - 1]) : { period: '' };
      let sum = 0;
      // Calculation logic for dividendpershare_at_cost field.
      if (period === 'Quarterly') {
        response.slice(response.length - 4, response.length).map(e => sum += e['value'])
      } else if (period === 'Annual') {
        response.slice(response.length - 1, response.length).map(e => sum += e['value'])
      } else if (period === 'SemiAnnual') {
        response.slice(response.length - 2, response.length).map(e => sum += e['value'])
      } else {
        // TFLO Symbol comes in this block
        response.slice(response.length - 1, response.length).map(e => sum += e['value'])
      }

      // Setting sum variable to dividendpershare_at_cost field of order table.
      dividendpershare_at_cost = sum;
    }

    return dividendpershare_at_cost;

  }

  public async gatherSymbols(aSymbolsWithStartDate: IDataGatheringItem[]) {
    for (const { dataSource, date, symbol } of aSymbolsWithStartDate) {
      if (dataSource === 'MANUAL') {
        continue;
      }

      await this.addJobToQueue(
        GATHER_HISTORICAL_MARKET_DATA_PROCESS,
        {
          dataSource,
          date,
          symbol
        },
        GATHER_HISTORICAL_MARKET_DATA_PROCESS_OPTIONS
      );
    }
  }

  public async getSymbolsMax(): Promise<IDataGatheringItem[]> {
    const startDate =
      (
        await this.prismaService.order.findFirst({
          orderBy: [{ date: 'asc' }]
        })
      )?.date ?? new Date();

    const currencyPairsToGather = this.exchangeRateDataService
      .getCurrencyPairs()
      .map(({ dataSource, symbol }) => {
        return {
          dataSource,
          symbol,
          date: startDate
        };
      });

    const symbolProfilesToGather = (
      await this.prismaService.symbolProfile.findMany({
        orderBy: [{ symbol: 'asc' }],
        select: {
          dataSource: true,
          Order: {
            orderBy: [{ date: 'asc' }],
            select: { date: true },
            take: 1
          },
          scraperConfiguration: true,
          symbol: true
        },
        where: {
          dataSource: {
            not: 'MANUAL'
          }
        }
      })
    ).map((symbolProfile) => {
      return {
        ...symbolProfile,
        date: symbolProfile.Order?.[0]?.date ?? startDate
      };
    });

    return [...currencyPairsToGather, ...symbolProfilesToGather];
  }

  public async getUniqueAssets(): Promise<UniqueAsset[]> {
    const symbolProfiles = await this.prismaService.symbolProfile.findMany({
      orderBy: [{ symbol: 'asc' }]
    });

    return symbolProfiles
      .filter(({ dataSource }) => {
        return (
          dataSource !== DataSource.GHOSTFOLIO &&
          dataSource !== DataSource.MANUAL &&
          dataSource !== DataSource.RAPID_API
        );
      })
      .map(({ dataSource, symbol }) => {
        return {
          dataSource,
          symbol
        };
      });
  }

  private async getSymbols7D(): Promise<IDataGatheringItem[]> {
    const startDate = subDays(resetHours(new Date()), 7);

    const symbolProfiles = await this.prismaService.symbolProfile.findMany({
      orderBy: [{ symbol: 'asc' }],
      select: {
        dataSource: true,
        scraperConfiguration: true,
        symbol: true
      },
      where: {
        dataSource: {
          not: 'MANUAL'
        }
      }
    });

    // Only consider symbols with incomplete market data for the last
    // 7 days
    const symbolsNotToGather = (
      await this.prismaService.marketData.groupBy({
        _count: true,
        by: ['symbol'],
        orderBy: [{ symbol: 'asc' }],
        where: {
          date: { gt: startDate }
        }
      })
    )
      .filter((group) => {
        return group._count >= 6;
      })
      .map((group) => {
        return group.symbol;
      });

    const symbolProfilesToGather = symbolProfiles
      .filter(({ symbol }) => {
        return !symbolsNotToGather.includes(symbol);
      })
      .map((symbolProfile) => {
        return {
          ...symbolProfile,
          date: startDate
        };
      });

    const currencyPairsToGather = this.exchangeRateDataService
      .getCurrencyPairs()
      .filter(({ symbol }) => {
        return !symbolsNotToGather.includes(symbol);
      })
      .map(({ dataSource, symbol }) => {
        return {
          dataSource,
          symbol,
          date: startDate
        };
      });

    return [...currencyPairsToGather, ...symbolProfilesToGather];
  }

  private async hasJob(name: string, data: any) {
    const jobs = await this.dataGatheringQueue.getJobs(
      QUEUE_JOB_STATUS_LIST.filter((status) => {
        return status !== 'completed';
      })
    );

    return jobs.some((job) => {
      return (
        job.name === name && JSON.stringify(job.data) === JSON.stringify(data)
      );
    });
  }
}
