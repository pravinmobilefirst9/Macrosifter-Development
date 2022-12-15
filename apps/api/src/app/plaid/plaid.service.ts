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

        console.log('BodyData->', data);

        const config = {
            method: 'post',
            url: 'https://sandbox.plaid.com/link/token/create',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        const response = await axios.post(config.url, data);
        console.log(response.data);
        return response.data;

        // let result;
        // axios(config)
        //     .then(function (response) {
        //         console.log(response.data);
        //         result = (response.data);
        //     })
        //     .catch(function (error) {
        //         console.log(error);

        //         throw new HttpException(
        //             getReasonPhrase(StatusCodes.FORBIDDEN),
        //             StatusCodes.FORBIDDEN
        //         );
        //     });


        // return result;

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
            console.log(error)
            throw new HttpException(
                getReasonPhrase(StatusCodes.FORBIDDEN),
                StatusCodes.FORBIDDEN
            );
        }

    }


    public async createLinkTokendemo() {
        return "DemoTesting1122"
    }


    public async handleItemWebhook(code, bodyData) {
        switch (code) {
            case "ERROR": {
                console.log(
                    `I received this error: ${bodyData.error.error_message}| should probably ask this user to connect to their bank`
                );

                const plaidToken = await this.prismaService.plaidToken.findFirst({
                    where: {
                        itemId: bodyData.item_id,
                    }
                })

                const isPlaidMessageExist = await this.prismaService.plaidMessages.findFirst({
                    where: {
                        itemId: bodyData.item_id
                    }
                })

                if (!isPlaidMessageExist) {

                    await this.prismaService.plaidMessages.create({
                        data: {
                            item_Login_Required_Status: true,
                            plaidTokenId: plaidToken.id,
                            itemId: bodyData.item_id
                        }
                    })
                } else {
                    await this.prismaService.plaidMessages.update({
                        data: {
                            item_Login_Required_Status: true,
                        },
                        where: {
                            id: isPlaidMessageExist.id
                        }
                    })
                }

            }
                break;
            case "NEW_ACCOUNTS_AVAILABLE":
                console.log(
                    `There are new accounts available at this Financial Institution! (Id: ${bodyData.item_id}) We might want to ask the user to share them with us`
                );
                break;
            case "PENDING_EXPIRATION":
                console.log(
                    `We should tell our user to reconnect their bank with Plaid so there's no disruption to their service`
                );
                break;
            case "USER_PERMISSION_REVOKED":
                console.log(
                    `The user revoked access to this item. We should remove it from our records`
                );
                break;
            case "WEBHOOK_UPDATE_ACKNOWLEDGED":
                console.log(`Hooray! You found the right spot!`);
                break;
            default:
                console.log(`Can't handle webhook code ${code}`);
                break;
        }
    }

    public async getPlaidMessages(userId: string) {

        try {

            const plaidTokens = await this.prismaService.plaidToken.findMany({
                where: {
                    userId: userId
                },
                include: {
                    PlaidMessages: true
                }
            })

            console.log(plaidTokens);
            const sanatizedData = [];
            plaidTokens.map(({ PlaidMessages, institutionUniqueId, accessToken, itemId }) => {
                if (PlaidMessages.length !== 0) {
                    PlaidMessages.map(({ item_Login_Required_Status }) => {
                        sanatizedData.push({ item_Login_Required_Status, institutionUniqueId, accessToken, itemId })
                    })
                }
            })


            return sanatizedData;

        } catch (error) {
            throw new HttpException(
                getReasonPhrase(StatusCodes.FORBIDDEN),
                StatusCodes.FORBIDDEN
            );
        }


    }

    public async updateItemLoginRequiredStatus(itemId: string) {

        try {

            const plaidMessages = await this.prismaService.plaidMessages.findFirst({
                where: {
                    itemId: itemId
                }
            })

            const result = await this.prismaService.plaidMessages.update({
                data: {
                    item_Login_Required_Status: false,
                },
                where: {
                    id: plaidMessages.id
                }
            })

            return result;

        } catch (error) {
            throw new HttpException(
                getReasonPhrase(StatusCodes.FORBIDDEN),
                StatusCodes.FORBIDDEN
            );
        }

    }

}


