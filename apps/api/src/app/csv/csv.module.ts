import { CSVDataGatheringModule } from "@ghostfolio/api/services/csv-data-gathering-module";
import { DataGatheringModule } from "@ghostfolio/api/services/data-gathering.module";
import { PrismaModule } from "@ghostfolio/api/services/prisma.module";
import { PrismaService } from "@ghostfolio/api/services/prisma.service";
import { Module } from "@nestjs/common";
import { CSVController } from "./csv.controller";
import { CSVService } from "./csv.service";


@Module({
    controllers: [CSVController],
    exports: [],
    imports: [PrismaModule, CSVDataGatheringModule],
    providers: [CSVService]
})
export class CSVModule { }