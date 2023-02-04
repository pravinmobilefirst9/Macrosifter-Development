import { ConfigurationModule } from '@ghostfolio/api/services/configuration.module';
import { DataGatheringService } from '@ghostfolio/api/services/data-gathering.service';
import { DataEnhancerModule } from '@ghostfolio/api/services/data-provider/data-enhancer/data-enhancer.module';
import { DataProviderModule } from '@ghostfolio/api/services/data-provider/data-provider.module';
import { PrismaModule } from '@ghostfolio/api/services/prisma.module';
import { CSV_DATA_GATHERING_QUEUE, DATA_GATHERING_QUEUE } from '@ghostfolio/common/config';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import ms from 'ms';
import { CSVDataGatheringProcessor } from './csv-data-gathering.processor';
import { CSVDataGatheringService } from './csv-data-gathering.service';
import { DataGatheringModule } from './data-gathering.module';

import { DataGatheringProcessor } from './data-gathering.processor';
import { ExchangeRateDataModule } from './exchange-rate-data.module';
import { MarketDataModule } from './market-data.module';
import { SymbolProfileModule } from './symbol-profile.module';

@Module({
    imports: [
        BullModule.registerQueue({
            limiter: {
                duration: ms('4 seconds'),
                max: 1
            },
            name: CSV_DATA_GATHERING_QUEUE
        }),
        ConfigurationModule,
        DataEnhancerModule,
        DataProviderModule,
        ExchangeRateDataModule,
        MarketDataModule,
        PrismaModule,
        SymbolProfileModule,
        DataGatheringModule
    ],
    providers: [CSVDataGatheringProcessor, CSVDataGatheringService],
    exports: [BullModule, DataEnhancerModule, CSVDataGatheringService]
})
export class CSVDataGatheringModule { }
