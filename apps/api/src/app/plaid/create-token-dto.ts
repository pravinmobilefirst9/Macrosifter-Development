import { IsString,IsNumber,IsArray, IsObject} from "class-validator";

export class CreateTokenDto{

    @IsString()
    client_id: string;

    @IsString()
    secret: string;
    
    @IsString()
    client_name: number;
    
    
    @IsArray()
    country_codes:string[];
    
    @IsString()
    language:string

    @IsObject()
    user:{}

    @IsArray()
    products:string[];


}