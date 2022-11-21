import { PrismaService } from "@ghostfolio/api/services/prisma.service";
import { HttpException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { CreateTokenDto } from "./create-token-dto";
import { OnPlaidSuccessDto } from "./on-plaid-success-dto";

const axios = require('axios');

@Injectable()
export class PlaidService {

    public constructor(private readonly prismaService: PrismaService) { }

    public async createLinkToken(data: CreateTokenDto) {


        var config = {
            method: 'post',
            url: 'https://sandbox.plaid.com/link/token/create',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        const result = axios(config)
            .then(function (response) {
                return (response.data);
            })
            .catch(function (error) {
                throw new HttpException(
                    getReasonPhrase(StatusCodes.FORBIDDEN),
                    StatusCodes.FORBIDDEN
                );
            });

        return result;

    }

    public async onPlaidSuccess(data: Prisma.AccountCreateManyInput[]) {

        try {

            const result = await this.prismaService.account.createMany({
                data
            });

            return {
                status: 'success',
                statusCode: 201,
                msg: 'account is verified with plaid we are importing account details'
            };

        } catch (error) {
            console.info(error)
            throw new HttpException(
                getReasonPhrase(StatusCodes.FORBIDDEN),
                StatusCodes.FORBIDDEN
            );
        }

    }


    public async createLinkTokendemo() {
        return "DemoTesting1122"
    }

}


