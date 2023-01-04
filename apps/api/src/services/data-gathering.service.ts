import { SymbolProfileService } from '@ghostfolio/api/services/symbol-profile.service';
import {
  DATA_GATHERING_QUEUE,
  GATHER_HISTORICAL_MARKET_DATA_PROCESS,
  GATHER_HISTORICAL_MARKET_DATA_PROCESS_OPTIONS,
  QUEUE_JOB_STATUS_LIST
} from '@ghostfolio/common/config';
import { DATE_FORMAT, resetHours } from '@ghostfolio/common/helper';
import { UniqueAsset } from '@ghostfolio/common/interfaces';
import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource } from '@prisma/client';
import { JobOptions, Queue } from 'bull';
import { format, subDays } from 'date-fns';
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
  public constructor(
    @Inject('DataEnhancers')
    private readonly dataEnhancers: DataEnhancerInterface[],
    @InjectQueue(DATA_GATHERING_QUEUE)
    private readonly dataGatheringQueue: Queue,
    private readonly dataProviderService: DataProviderService,
    private readonly exchangeRateDataService: ExchangeRateDataService,
    private readonly marketDataService: MarketDataService,
    private readonly prismaService: PrismaService,
    private readonly symbolProfileService: SymbolProfileService
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

  public async gather7Days() {
    const dataGatheringItems = await this.getSymbols7D();
    await this.gatherSymbols(dataGatheringItems);
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
      return undefined;
    }
  }

  public async gatherAssetProfiles(aUniqueAssets?: UniqueAsset[]) {
    console.log('========================================================================');
    console.log(`====================gatherAssetProfiles  =================================`);
    console.log('========================================================================');

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

      const data = await this.getHistoricalDividendData(symbol);

      const marketData = await this.prismaService.marketData.findFirst({
        where: {
          symbol
        }
      })
      const finalMarketData = []

      if (marketData) {
        console.log("Market data exist");


        for (let i = 0; i < data.length; i++) {

          const obj = {
            dataSource: 'EOD_HISTORICAL_DATA',
            marketDataId: marketData['id'],
            symbol,
            value: data[i]['value'],
            unadjusted_value: data[i]['unadjustedValue'],
            date: (data[i]['paymentDate']) ? (data[i]['paymentDate']) : (data[i]['date']),
            currency: data[i]['currency'],
          }

          obj['date'] = new Date(obj['date']);

          finalMarketData.push(obj);

        }

        const isDividendDataExist = await this.prismaService.dividendData.findFirst({
          where: {
            symbol
          }
        })

        if (!(isDividendDataExist)) {

          await this.prismaService.dividendData.createMany({
            data: [
              ...finalMarketData
            ],
            skipDuplicates: true,
          })

        }

      } else {
        console.log("Market data does not exist");
      }
      // 
      let dividendpershare = null;
      let dividendpershare_type = null;

      const { summaryDetail } = await this.getSymbolDetail(symbol);

      if (!(summaryDetail)) {
        dividendpershare = null;
        dividendpershare_type = null;
      } else {

        dividendpershare = summaryDetail['dividendRate'] ? summaryDetail['dividendRate'] :
          (summaryDetail['trailingAnnualDividendRate']) ? summaryDetail['trailingAnnualDividendRate'] : null;

        dividendpershare_type = summaryDetail['dividendRate'] ? 1 : (summaryDetail['trailingAnnualDividendRate']) ? 0 : null;
      }



      let dividend = 0;
      const dataSource2 = {
        source1: 'EOD_HISTORICAL_DATA'
      }
      let dividend_period = null;

      if (!(data)) {
        dividend = 0;

      } else if (data && data.length === 0) {
        dividend = 0;
      } else {
        dividend = 1;
        dividend_period = data[data.length - 1]['period'] ? data[data.length - 1]['period'] : null;

        if (!(dividend_period)) {
          dividend_period = this.calculatePeriod(data);
        }


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
