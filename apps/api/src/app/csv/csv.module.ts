import { DataGatheringModule } from "@ghostfolio/api/services/data-gathering.module";
import { PrismaModule } from "@ghostfolio/api/services/prisma.module";
import { Module } from "@nestjs/common";
import { CSVController } from "./csv.controller";
import { CSVService } from "./csv.service";


@Module({
    controllers: [CSVController],
    exports: [CSVService],
    imports: [PrismaModule, DataGatheringModule],
    providers: [CSVService]
})
export class CSVModule { }