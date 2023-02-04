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
    @Get('get-csv-order')
    public async getCSVOrder() {
        try {

            const orders = await this.prismaService.orderCSV.findMany({
                where: {
                    userId: this.request.user.id
                }
            })

            return orders;

        } catch (error) {

        }
    }



    @UseGuards(AuthGuard('jwt'))
    @Post('post-csv-file-upload')
    public async postCSVFileUpload(@Body() bodyData) {

        try {

            const isFileExist = await this.prismaService.orderCSV.findFirst({
                where: {
                    fileName: bodyData['fileName'],
                    userId: this.request.user.id,
                    // status: 'IN_PROGRESS'
                }
            })

            if (isFileExist) {
                return {
                    status: `This file is already ${isFileExist.status}!`
                }
            } else {

                await this.prismaService.orderCSV.create({
                    data: {
                        fileName: bodyData['fileName'],
                        completedOrder: 0,
                        status: 'IN_PROGRESS',
                        totalOrder: bodyData['csv_data'].length,
                        Account: {
                            connect: {
                                id_userId: {
                                    id: bodyData['accountId'],
                                    userId: this.request.user.id
                                }
                            }
                        },
                        Institution: {
                            connect: {
                                id: bodyData['institutionId'],
                            }
                        },
                        User: {
                            connect: {
                                id: this.request.user.id
                            }
                        }
                    }
                })

                const orders = await this.prismaService.orderCSV.findMany({
                    where: {
                        userId: this.request.user.id,
                    }
                })

                this.csvService.postCSVFileUpload(bodyData, this.request.user.id);

                return {
                    status: 'IN_PROGRESS',
                    data: orders
                }

            }

        } catch (error) {
            console.log(error);
        }


    }



}