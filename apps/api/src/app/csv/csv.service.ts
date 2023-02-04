import { CSVDataGatheringService } from "@ghostfolio/api/services/csv-data-gathering.service";
import { CSV_IMPORT_DATA_PROCESS, CSV_IMPORT_DATA_PROCESS_OPTIONS } from "@ghostfolio/common/config";
import { Injectable } from "@nestjs/common";



@Injectable()
export class CSVService {

    constructor(public readonly csvDataGatheringService: CSVDataGatheringService) { }

    public async postCSVFileUpload(bodyData, userId) {

        try {

            const { institutionId, accountId, csv_data, fileName } = bodyData;

            for (const order of csv_data) {
                console.log(' Adding to Queue-------> ', order['SYMBOL']);
                await this.csvDataGatheringService.addJobToQueue(
                    CSV_IMPORT_DATA_PROCESS,
                    {
                        csv_data: { ...order }, accountId, institutionId, userId, fileName
                    },
                    CSV_IMPORT_DATA_PROCESS_OPTIONS
                );

            }

        } catch (error) {
            console.log(error);

        }

        return {
            bodyData
        }


    }

}