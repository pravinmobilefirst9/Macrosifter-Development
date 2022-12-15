import { IsString, IsNumber, IsArray, IsObject } from "class-validator";

export class OnPlaidSuccessDto {


    @IsArray()
    accounts: [
        {
            id: string,
            name: string,
            type: string,
            subtype: string
        }
    ];

    @IsObject()
    institution: {
        institution_id: string,
        name: string
    }
    @IsString()
    public_token: string;

    @IsString()
    userId: string;


}