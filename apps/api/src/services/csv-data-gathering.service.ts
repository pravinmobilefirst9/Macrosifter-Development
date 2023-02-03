import { CSV_DATA_GATHERING_QUEUE, DATA_GATHERING_QUEUE, QUEUE_JOB_STATUS_LIST } from "@ghostfolio/common/config";
import { InjectQueue } from "@nestjs/bull";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { JobOptions, Queue } from "bull";
import { DataEnhancerInterface } from "./data-provider/interfaces/data-enhancer.interface";
import { PrismaService } from "./prisma.service";



@Injectable()
export class CSVDataGatheringService {


    public constructor(
        @Inject('DataEnhancers')
        private readonly dataEnhancers: DataEnhancerInterface[],
        @InjectQueue(CSV_DATA_GATHERING_QUEUE)
        private readonly csvDataGatheringQueue: Queue,
    ) { }

    public async addJobToQueue(name: string, data: any, options?: JobOptions) {
        const hasJob = await this.hasJob(name, data);

        if (hasJob) {
            Logger.log(
                `Job ${name} with data ${JSON.stringify(data)} already exists.`,
                'DataGatheringService'
            );
        } else {
            return this.csvDataGatheringQueue.add(name, data, options);
        }
    }

    public async uploadCSV(data: { institutionId: string, accountId: string, csv_data: { any }[] }): Promise<void> {

        const { institutionId, accountId, csv_data } = data;





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
            console.log(error);

        }
    }






}
