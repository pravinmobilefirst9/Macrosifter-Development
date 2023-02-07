import { IsString} from "class-validator";

export class RetrieveBalanceDto{
    @IsString()
    client_id: string;

    @IsString()
    secret: string;

    @IsString()
    access_token: string;
}