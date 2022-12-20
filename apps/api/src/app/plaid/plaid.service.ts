import { PrismaService } from "@ghostfolio/api/services/prisma.service";
import { HttpException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { CreateTokenDto } from "./create-token-dto";
import { OnPlaidSuccessDto } from "./on-plaid-success-dto";

const axios = require('axios');

@Injectable()
export class PlaidService {

    public PLAID_BASE_URI = process.env.PLAID_BASE_URI;
    public constructor(private readonly prismaService: PrismaService) { }

    public async createLinkToken(data) {

        const config = {
            method: 'post',
            url: this.PLAID_BASE_URI + '/link/token/create',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        try {
            const response = await axios.post(config.url, data);
            return response.data;

        } catch (error) {
            console.log(error);
            throw new HttpException(
                getReasonPhrase(StatusCodes.FORBIDDEN),
                StatusCodes.FORBIDDEN
            );
        }




    }

    public async onPlaidSuccess(data: Prisma.AccountCreateManyInput[], plaidToken: any) {

        try {

            const result = await this.prismaService.account.createMany({
                data
            });

            if (data[0] && data[0].verification_status === 'pending_automatic_verification') {
                return {
                    status: 'pending_automatic_verification',
                    statusCode: 201,
                    plaidToken,
                    msg: 'Your account is pending automatic verification'
                };
            }

            return {
                status: 'success',
                statusCode: 201,
                plaidToken,
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
            console.log(error);
            throw new HttpException(
                getReasonPhrase(StatusCodes.FORBIDDEN),
                StatusCodes.FORBIDDEN
            );
        }

    }

}


