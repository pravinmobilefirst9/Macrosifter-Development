import {
  GATHER_ASSET_PROFILE_PROCESS,
  GATHER_ASSET_PROFILE_PROCESS_OPTIONS
} from '@ghostfolio/common/config';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CSVService } from '../app/csv/csv.service';
import { RedisCacheService } from '../app/redis-cache/redis-cache.service';

import { DataGatheringService } from './data-gathering.service';
import { ExchangeRateDataService } from './exchange-rate-data.service';
import { TwitterBotService } from './twitter-bot/twitter-bot.service';

@Injectable()
export class CronService {
  public constructor(
    private readonly dataGatheringService: DataGatheringService,
    private readonly exchangeRateDataService: ExchangeRateDataService,
    private readonly twitterBotService: TwitterBotService,
    private readonly redisCacheService: RedisCacheService,
    private readonly csvService: CSVService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  public async runEveryHour() {
    await this.dataGatheringService.gather7Days();
  }

  // Macrosifter MarketData Cron
  @Cron(CronExpression.EVERY_HOUR)
  public async syncMarketData() {
    await this.dataGatheringService.gather7Days();
  }

  // CRON AUTOMATION Cache Reset Cron Daily
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async resetRedisCache() {
    await this.redisCacheService.reset();
  }

  // CRON AUTOMATION DividendData Cron twice a month
  @Cron('0 0 1,15 * *')
  public async syncDividendData() {
    await this.dataGatheringService.gatherDividendData();
  }

  // Macrosifter SplitData Cron
  @Cron(CronExpression.EVERY_HOUR)
  public async syncSplitData() {
    await this.dataGatheringService.gatherSplitData();
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  public async runEveryTwelveHours() {
    await this.exchangeRateDataService.loadCurrencies();
  }

  // Macrosifter Test Cron
  // @Cron(CronExpression.EVERY_10_MINUTES)
  // public async test() {
  //   Logger.log({
  //     name: 'MacroSifter Testing Account Cron'
  //   });
  // }

  @Cron(CronExpression.EVERY_DAY_AT_5PM)
  public async runEveryDayAtFivePM() {
    this.twitterBotService.tweetFearAndGreedIndex();
  }

  @Cron(CronExpression.EVERY_WEEKEND)
  public async runEveryWeekend() {
    const uniqueAssets = await this.dataGatheringService.getUniqueAssets();

    for (const { dataSource, symbol } of uniqueAssets) {
      await this.dataGatheringService.addJobToQueue(
        GATHER_ASSET_PROFILE_PROCESS,
        {
          dataSource,
          symbol
        },
        GATHER_ASSET_PROFILE_PROCESS_OPTIONS
      );
    }
  }

  // CRON AUTOMATION - Macrosifter sync new SymbolProfile data fields once a month
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  public async syncSymbolProfile() {
    const uniqueAssets = await this.dataGatheringService.getUniqueAssets();

    for (const { dataSource, symbol } of uniqueAssets) {
      await this.dataGatheringService.addJobToQueue(
        GATHER_ASSET_PROFILE_PROCESS,
        {
          dataSource,
          symbol
        },
        GATHER_ASSET_PROFILE_PROCESS_OPTIONS
      );
    }
  }

  // CRON AUTOMATION FOR Missing Data Inside the Symbol Profile, DividendData or MarketData Hourly
  @Cron(CronExpression.EVERY_HOUR)
  public async automation_SymbolProfile_DividendData_MarketData() {
    this.syncMarketData();
    this.syncSymbolProfile();
    this.syncDividendData();
    this.syncSplitData();
  }

  // @Cron(CronExpression.EVERY_30_MINUTES)
  // public async updateDividendPerShareAtCost() {
  //   await this.csvService.updateDividendPershareAtCost();
  // }
}
