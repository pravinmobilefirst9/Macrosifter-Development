import { DataGatheringModule } from "@ghostfolio/api/services/data-gathering.module";
import { PrismaModule } from "@ghostfolio/api/services/prisma.module";
import { Module } from "@nestjs/common";
import { PlaidController } from "./plaid.controller";
import { PlaidService } from "./plaid.service";


@Module({
    controllers: [PlaidController],
    exports: [PlaidService],
    imports: [PrismaModule, DataGatheringModule],
    providers: [PlaidService]
})
export class PlaidModule { }