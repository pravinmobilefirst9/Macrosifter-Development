import { CSV_DATA_GATHERING_QUEUE, DATA_GATHERING_QUEUE, QUEUE_JOB_STATUS_LIST } from "@ghostfolio/common/config";
import { InjectQueue } from "@nestjs/bull";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { JobOptions, Queue } from "bull";
import { parseISO } from "date-fns";
import { DataGatheringService } from "./data-gathering.service";
import { DataEnhancerInterface } from "./data-provider/interfaces/data-enhancer.interface";
import { PrismaService } from "./prisma.service";
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class CSVDataGatheringService {


    public constructor(
        @Inject('DataEnhancers')
        private readonly dataEnhancers: DataEnhancerInterface[],
        @InjectQueue(CSV_DATA_GATHERING_QUEUE)
        private readonly csvDataGatheringQueue: Queue,
        public readonly prismaService: PrismaService,
        public readonly dataGatheringService: DataGatheringService,
    ) { }

    public async addJobToQueue(name: string, data: any, options?: JobOptions) {
        const hasJob = await this.hasJob(name, data);

        if (hasJob) {
            Logger.log(
                `Job ${name} with data ${JSON.stringify(data)} already exists.`,
                'CSVDataGatheringService'
            );
        } else {
            return this.csvDataGatheringQueue.add(name, data, options);
        }
    }

    public async isDuplicateActivity(csv_data, userId) {

        try {

            const isOrderExist = await this.prismaService.order.findFirst({
                where: {
                    userId: userId,
                    transactionId: csv_data['TRANSACTION ID']
                }
            })

            return isOrderExist ? true : false;

        } catch (error) {
            return false;
        }

    }

    public async getActivitySubTypeId(subtype) {
        try {

            const data = await this.prismaService.activitySubType.findFirst({
                where: {
                    subtype,
                }
            })

            return (data && data.id) ? data.id : null;

        } catch (error) {
            return null;
        }

    }

    public async updateCSVOrder(csv_data, fileName, userId, accountId, institutionId) {
        try {

            const orderCSV = await this.prismaService.orderCSV.findFirst({
                where: {
                    userId: userId,
                    accountId: accountId,
                    fileName: fileName,
                    institutionId: institutionId,
                }
            })

            if (orderCSV && orderCSV.status === 'IN_PROGRESS') {

                await this.prismaService.orderCSV.update({
                    where: {
                        id: orderCSV.id,
                    },
                    data: {
                        completedOrder: {
                            increment: 1,
                        },
                        status: ((orderCSV.completedOrder + 1) === orderCSV.totalOrder) ? 'COMPLETED' : 'IN_PROGRESS'
                    }
                })

            }

        } catch (error) {
            console.log(error);
        }
    }

    public async uploadCSV(data: { institutionId: string, accountId: string, csv_data: { any }[], userId: string, fileName: string }, userId): Promise<void> {

        const { institutionId, accountId, csv_data, fileName } = data;

        if (!(csv_data['TRANSACTION ID'])) {
            return;
        }

        if (!(Object.prototype.hasOwnProperty.call(csv_data, "TRANSACTION ID"))) {
            return;
        }

        csv_data['TRANSACTION ID'] = csv_data['TRANSACTION ID'].toString()
        const description = csv_data['DESCRIPTION'] ? csv_data['DESCRIPTION'] : null;

        await this.updateCSVOrder(csv_data, fileName, userId, accountId, institutionId);

        if (await this.isDuplicateActivity(csv_data, userId)) {
            console.log('SKipped - ', csv_data['SYMBOL']);
            return;
        }
        if (!(description)) {
            return;
        }

        if (description.includes('ELECTRONIC NEW ACCOUNT FUNDING')) {
            return;
        }

        if (description.includes('INTRA-ACCOUNT TRANSFER') || description.includes('CLIENT REQUESTED ELECTRONIC FUNDING RECEIPT (FUNDS NOW)') ||
            description.includes('ACH') || description.includes('INTERNAL TRANSFER BETWEEN ACCOUNTS OR ACCOUNT TYPES') || description.includes('MISCELLANEOUS JOURNAL ENTRY') || description.includes('CLIENT REQUESTED ELECTRONIC FUNDING DISBURSEMENT (FUNDS NOW)')
        ) {
            return;
        }

        let type = null;
        let subtype = null;
        let comment = null;

        if (description.includes('Bought')) {
            type = 'BUY'
            subtype = await this.getActivitySubTypeId('Buy')
            if (csv_data['SYMBOL'] === 'CSCO') {
                subtype = await this.getActivitySubTypeId('Qualified Dividend Reinvestment')
            }
            if (csv_data['SYMBOL'] === 'PBA') {
                subtype = await this.getActivitySubTypeId('Qualified Dividend Reinvestment')
            }
        } else if (description.includes('DIVIDEND')) {
            type = 'DIVIDEND'
            subtype = await this.getActivitySubTypeId('Ordinary Dividend')
        } else if (description.includes('Sold')) {
            type = 'SELL'
            subtype = await this.getActivitySubTypeId('Sell')
        } else {
            type = 'ITEM'
            subtype = await this.getActivitySubTypeId('ITEM')
        }


        if (description.includes('FREE BALANCE INTEREST ADJUSTMENT')) {
            type = 'CASH'
            subtype = await this.getActivitySubTypeId('INTEST')
            comment = 'FREE BALANCE INTEREST ADJUSTMENT'
        }
        if (description.includes('OFF-CYCLE INTEREST (MMDA10)')) {
            type = 'CASH'
            subtype = await this.getActivitySubTypeId('INTEST')
            comment = 'OFF-CYCLE INTEREST (MMDA10)'
        }

        if (description.includes('REBATE')) {
            type = 'CASH'
            subtype = await this.getActivitySubTypeId('DEPOSIT')
            comment = 'REBATE'
        }

        if (description.includes('MANDATORY - NAME CHANGE')) {
            type = 'TRANSFER'
            subtype = await this.getActivitySubTypeId('TRANSFER')
            comment = 'MANDATORY - NAME CHANGE'
        }

        if (description.includes('MARGIN INTEREST ADJUSTMENT')) {
            type = 'FEES'
            subtype = await this.getActivitySubTypeId('Margin Expense')
            comment = 'MARGIN INTEREST ADJUSTMENT'
        }

        const symbolProfileId = ((csv_data["SYMBOL"])) ? await this.dataGatheringService.getSymbolProfileId(csv_data['SYMBOL']) : null;
        const dividendpershare_at_cost = ((csv_data["SYMBOL"])) ? await this.dataGatheringService.getDividendpershareAtCost(csv_data['SYMBOL'], new Date(csv_data['DATE'])) : null;

        // const dividendpershare_at_cost = 0;

        if (description && description.includes('QUALIFIED DIVIDEND')) {
            type = 'DIVIDEND';
            subtype = await this.getActivitySubTypeId('Qualified Dividend')
            comment = description;
        }

        if (description && description.includes('Foreign Tax Withheld')) {
            type = 'FEES';
            subtype = await this.getActivitySubTypeId('Foreign Tax Withheld')
        }
        if (description && description.includes('FOREIGN TAX WITHHELD')) {
            type = 'FEES';
            subtype = await this.getActivitySubTypeId('Foreign Tax Withheld')
        }

        comment = description;

        let fee = 0;

        if (csv_data['REG FEE']) {
            fee += csv_data['REG FEE'];
        }
        if (csv_data['SHORT-TERM RDM FEE']) {
            fee += csv_data['SHORT-TERM RDM FEE'];
        }
        if (csv_data['FUND REDEMPTION FEE']) {
            fee += csv_data['FUND REDEMPTION FEE'];
        }

        if (csv_data['COMMISSION']) {
            fee += csv_data['COMMISSION'];
        }



        const date = parseISO(csv_data['DATE'])

        if (!(csv_data['SYMBOL'])) {

            type = 'CASH';
            subtype = await this.getActivitySubTypeId('Deposit')
            comment = description;
            const id = uuidv4();

            await this.prismaService.order.create({
                data: {
                    date: date,
                    fee,
                    quantity: csv_data['QUANTITY'] ? csv_data['QUANTITY'] : 1,
                    type,
                    subtype,
                    unitPrice: csv_data['PRICE'] ? csv_data['PRICE'] : csv_data['AMOUNT'],
                    transactionId: csv_data['TRANSACTION ID'],
                    comment,
                    User: {
                        connect: {
                            id: userId
                        }
                    },
                    SymbolProfile: {
                        create: {
                            currency: 'USD',
                            dataSource: 'MANUAL',
                            symbol: id,
                        }
                    },
                    Account: {
                        connect: {
                            id_userId: {
                                id: accountId,
                                userId: userId
                            }
                        }
                    }
                }
            })

            console.log('imported csv successfully for ---> NULL Symbol');
            return;
        }

        const obj = {

            date: date,
            fee,
            quantity: csv_data['QUANTITY'] ? csv_data['QUANTITY'] : 1,
            type,
            unitPrice: csv_data['PRICE'] ? csv_data['PRICE'] : csv_data['AMOUNT'],
            dividendpershare_at_cost,
            subtype,
            comment,
            transactionId: csv_data['TRANSACTION ID']

        }


        if (csv_data["SYMBOL"]) {

            try {

                await this.prismaService.order.create({
                    data: {
                        ...obj,
                        Account: {
                            connect: {
                                id_userId: {
                                    id: accountId,
                                    userId: userId
                                }
                            }
                        },
                        User: {
                            connect: {
                                id: userId
                            }
                        },
                        SymbolProfile: {
                            connect: {
                                id: symbolProfileId
                            }
                        },
                    }
                })



                // Gathering SymbolProfile Table Data
                await this.dataGatheringService.gatherAssetProfiles([{
                    dataSource: 'YAHOO',
                    symbol: csv_data['SYMBOL']
                }]);

                // MarkerData Table Data
                await this.dataGatheringService.gatherHistoricalMarketData(
                    { dataSource: 'YAHOO', date: new Date('01-01-2010').toISOString(), symbol: csv_data['SYMBOL'] }
                )



            } catch (error) {
                console.log(error);
            }

            console.log('imported csv successfully for ---> ', csv_data['SYMBOL']);

        }


    }


    private async hasJob(name: string, data: any) {
        try {


            const jobs = await this.csvDataGatheringQueue.getJobs(
                QUEUE_JOB_STATUS_LIST.filter((status) => {
                    return status !== 'completed';
                })
            );

            return jobs.some((job) => {
                return (
                    job.name === name && JSON.stringify(job.data) === JSON.stringify(data)
                );
            });
        } catch (error) {

        }
    }






}
