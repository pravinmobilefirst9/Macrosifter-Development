







import { IsString, IsNumber, IsArray, IsObject } from "class-validator";

export class PostFileCsvUploadDto {


    @IsObject()
    csv_data: object;

    @IsString()
    institutionId: string;

    @IsString()
    accountId: string;

    @IsString()
    fileName: string;


}