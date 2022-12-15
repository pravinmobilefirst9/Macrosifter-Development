import { IsString, IsNumber, IsArray, IsObject, IsOptional } from "class-validator";

export class CreateTokenDto {

    @IsString()
    client_id: string;

    @IsString()
    secret: string;

    @IsString()
    client_name: string;

    @IsString()
    redirect_uri: string;

    @IsString()
    @IsOptional()
    access_token: string;

    @IsArray()
    country_codes: string[];

    @IsString()
    language: string

    @IsString()
    webhook: string

    @IsObject()
    user: {}

    @IsObject()
    @IsOptional()
    auth: {}

    @IsObject()
    @IsOptional()
    update: {}

    @IsArray()
    products?: string[];


}