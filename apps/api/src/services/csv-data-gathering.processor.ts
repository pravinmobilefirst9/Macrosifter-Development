import { CSV_DATA_GATHERING_QUEUE, CSV_IMPORT_DATA_PROCESS } from "@ghostfolio/common/config";
import { UniqueAsset } from "@ghostfolio/common/interfaces";
import { Process, Processor } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Job } from "bull";
import { CSVDataGatheringService } from "./csv-data-gathering.service";


@Injectable()
@Processor(CSV_DATA_GATHERING_QUEUE)
export class CSVDataGatheringProcessor {

    public constructor(
        private readonly csvDataGatheringService: CSVDataGatheringService,
    ) { }



    @Process(CSV_IMPORT_DATA_PROCESS)
    public async xyz(job: Job<{ institutionId: string, accountId: string, csv_data: [] }>) {

        const data: { institutionId: string, accountId: string, csv_data: [] } = job.data;

        await this.csvDataGatheringService.uploadCSV(data);



    }


}