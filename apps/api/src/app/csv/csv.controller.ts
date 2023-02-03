import { CSVDataGatheringService } from "@ghostfolio/api/services/csv-data-gathering.service";
import { PrismaService } from "@ghostfolio/api/services/prisma.service";
import { CSV_IMPORT_DATA_PROCESS, CSV_IMPORT_DATA_PROCESS_OPTIONS } from "@ghostfolio/common/config";
import { RequestWithUser } from "@ghostfolio/common/types";
import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { JobOptions, Queue } from 'bull';
import { CSVService } from "./csv.service";



@Controller('csv')
export class CSVController {

    public constructor(
        @Inject(REQUEST) private readonly request: RequestWithUser,
        public readonly prismaService: PrismaService,
        public readonly csvDataGatheringService: CSVDataGatheringService,
        public readonly csvService: CSVService,

    ) {


    }


    @UseGuards(AuthGuard('jwt'))
    @Get('get-institution-for-csv-upload')
    public async createLinkToken() {

        try {

            const data = await this.prismaService.plaidToken.findMany({
                where: {
                    userId: this.request.user.id
                },
                include: {
                    Institution: true,
                    Account: true
                }
            })

            const institution = data.map((e) => {
                const obj = {
                    institutionId: e['Institution']['id'],
                    institutionName: e['Institution']['institutionName'],
                }

                obj['accounts'] = e['Account'].map((e2) => {
                    return {
                        accountId: e2['id'],
                        accountName: e2['name']
                    }
                })

                return obj;
            })


            return institution;

        } catch (error) {
            console.log(error);
            return []
        }


    }

    @UseGuards(AuthGuard('jwt'))
    @Post('post-csv-file-upload')
    public async postCSVFileUpload(@Body() bodyData) {

        this.csvService.postCSVFileUpload(bodyData);
        return {
            status: 'IN_PROGRESS'
        }
    }



}