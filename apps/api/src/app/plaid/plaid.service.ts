import { PrismaService } from "@ghostfolio/api/services/prisma.service";
import { HttpException, Injectable } from "@nestjs/common";
import { Institution, PlaidToken, Prisma } from "@prisma/client";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { CreateTokenDto } from "./create-token-dto";
import { OnPlaidSuccessDto } from "./on-plaid-success-dto";

const axios = require('axios');

@Injectable()
export class PlaidService {

    public PLAID_BASE_URI = process.env.PLAID_BASE_URI;
    public PLAID_CLIENT_ID = process.env.CLIENT_ID;
    public PLAID_SECRET_ID = process.env.SECRET_ID;
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
    public async createLinkTokenTwoDeposit(data) {

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

    public async getBalance(access_token) {

        const data = JSON.stringify({
            "client_id": this.PLAID_CLIENT_ID,
            "secret": this.PLAID_SECRET_ID,
            "access_token": access_token
        });

        const config = {
            method: 'post',
            url: this.PLAID_BASE_URI + `/accounts/balance/get`,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };


        try {
            const response = await axios(config)
            return response.data;
        } catch (error) {
            return null;
        }


    }

    public async updateBalance(account, userId: string) {

        const { account_id, balances, verification_status, type } = account;

        const current_account = await this.prismaService.account.findFirst({
            where: {
                userId: userId,
                account_id: account_id
            }
        })

        await this.prismaService.account.update({
            where: {
                id_userId: {
                    id: current_account.id,
                    userId: userId
                }
            },
            data: {
                verification_status: verification_status,
                // balance: balances.current // Previous Logic for balance
                balance: (type === 'investment') ? 0 : balances.current // Current Logic for balance
            }
        })

    }

    public async fetchLatestBalance(userId: string) {

        const plaidTokens: PlaidToken[] = await this.prismaService.plaidToken.findMany({
            where: {
                userId: userId
            }
        })

        for (let i = 0; i < plaidTokens.length; i++) {

            if (plaidTokens[i].accessToken) {
                const result = await this.getBalance(plaidTokens[i].accessToken)
                if (result) {

                    const accounts = result.accounts;

                    for (let j = 0; j < accounts.length; j++) {
                        await this.updateBalance(accounts[j], userId);
                    }


                }

            }
        }

        return 'updated with latest balance';
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

            if (data[0] && data[0].verification_status === 'pending_manual_verification') {
                return {
                    status: 'pending_manual_verification',
                    statusCode: 201,
                    plaidToken,
                    msg: 'Your account is pending manual verification'
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

    public async handleAuthWebhook(code, bodyData) {
        switch (code) {
            case "AUTOMATICALLY_VERIFIED": {

                const {
                    account_id,
                } = bodyData;


                const isAccount_idExist = await this.prismaService.account
                    .findFirst({
                        where: {
                            account_id: account_id
                        }
                    })

                if (isAccount_idExist) {

                    await this.prismaService.account.update({
                        data: {
                            verification_status: 'automatically_verified'
                        },
                        where: {
                            id_userId: {
                                id: isAccount_idExist.id,
                                userId: isAccount_idExist.userId
                            }
                        }
                    })

                }

            }
                break;

            case "VERIFICATION_EXPIRED": {

                const {
                    account_id,
                } = bodyData;

                const isAccount_idExist = await this.prismaService.account
                    .findFirst({
                        where: {
                            account_id: account_id
                        }
                    })

                if (isAccount_idExist) {

                    await this.prismaService.account.update({
                        data: {
                            verification_status: 'verification_expired'
                        },
                        where: {
                            id_userId: {
                                id: isAccount_idExist.id,
                                userId: isAccount_idExist.userId
                            }
                        }
                    })

                }

            }
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

    public async updateManualTwoDepositStatus(bodyData: any) {

        try {

            const { accounts, userId } = bodyData;


            if (!(bodyData.verification_failed)) {

                const existingAccount = await this.prismaService.account.
                    findFirst({
                        where: {
                            account_id: accounts[0].id,
                            userId: userId,
                            Institution: {
                                institutionUniqueId: 'same_day'
                            }
                        }
                    })


                const updatedAccount = await this.prismaService.account.update({
                    data: {
                        verification_status: accounts[0].verification_status
                    },
                    where: {
                        id_userId: {
                            id: existingAccount.id,
                            userId: userId,
                        },
                    }
                })

                return {
                    verification_status: accounts[0].verification_status,
                    statusCode: 201,
                    updatedAccount,
                    msg: ``
                };


            }


            if (bodyData.verification_failed) {


                const { account_id } = bodyData

                const isAccountExist = await this.prismaService.account.findFirst({
                    where: {
                        account_id: account_id,
                        userId: userId
                    }
                })

                const updatedAccount = await this.prismaService.account.update({
                    data: {
                        verification_status: 'verification_failed'
                    },
                    where: {
                        id_userId: {
                            id: isAccountExist.id,
                            userId: userId
                        }
                    }
                })

                return {
                    verification_status: 'verification_failed',
                    statusCode: 201,
                    updatedAccount,
                    msg: `Your account manual verification is verification_failed`
                };


            }

        } catch (error) {
            console.log(error);
            throw new HttpException(
                getReasonPhrase(StatusCodes.FORBIDDEN),
                StatusCodes.FORBIDDEN
            );
        }

    }

}



// {
//     "accounts": [
//         {
//             "account_id": "MAMnkV4b4wsEarQ7eq7vuw4XBMKokqs73wVax",
//             "balances": {
//                 "available": 100,
//                 "current": 110,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "0000",
//             "name": "Plaid Checking",
//             "official_name": "Plaid Gold Standard 0% Interest Checking",
//             "subtype": "checking",
//             "type": "depository"
//         },
//         {
//             "account_id": "1GpAnBVKVyIGaoErbpryCX6VqzdnMpfm4Ll6R",
//             "balances": {
//                 "available": 200,
//                 "current": 210,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "1111",
//             "name": "Plaid Saving",
//             "official_name": "Plaid Silver Standard 0.1% Interest Saving",
//             "subtype": "savings",
//             "type": "depository"
//         },
//         {
//             "account_id": "LWZA8wanajCJdKzyrlyWuke6VqyB4Nc91vGZ5",
//             "balances": {
//                 "available": null,
//                 "current": 1000,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "2222",
//             "name": "Plaid CD",
//             "official_name": "Plaid Bronze Standard 0.2% Interest CD",
//             "subtype": "cd",
//             "type": "depository"
//         },
//         {
//             "account_id": "3qgZmxbzbBCgo1AwvLwKu3kjR9zevnT8kK34L",
//             "balances": {
//                 "available": null,
//                 "current": 410,
//                 "iso_currency_code": "USD",
//                 "limit": 2000,
//                 "unofficial_currency_code": null
//             },
//             "mask": "3333",
//             "name": "Plaid Credit Card",
//             "official_name": "Plaid Diamond 12.5% APR Interest Credit Card",
//             "subtype": "credit card",
//             "type": "credit"
//         },
//         {
//             "account_id": "qBV6noDWDXuB9o5ekKeEUe5b5X5GGmsV9Akpv",
//             "balances": {
//                 "available": 43200,
//                 "current": 43200,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "4444",
//             "name": "Plaid Money Market",
//             "official_name": "Plaid Platinum Standard 1.85% Interest Money Market",
//             "subtype": "money market",
//             "type": "depository"
//         },
//         {
//             "account_id": "KEQLgWdGdaiXxqgaJ3aBFyEoE4Eee1HmeWbdg",
//             "balances": {
//                 "available": null,
//                 "current": 320.76,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "5555",
//             "name": "Plaid IRA",
//             "official_name": null,
//             "subtype": "ira",
//             "type": "investment"
//         },
//         {
//             "account_id": "r3V6boDADRukKZRQvrQxcbXxXyX99jiDjqg8y",
//             "balances": {
//                 "available": null,
//                 "current": 23631.9805,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "6666",
//             "name": "Plaid 401k",
//             "official_name": null,
//             "subtype": "401k",
//             "type": "investment"
//         },
//         {
//             "account_id": "z7q631rRrMtaEye83N8WueKqKzKddJsgRJWko",
//             "balances": {
//                 "available": null,
//                 "current": 65262,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "7777",
//             "name": "Plaid Student Loan",
//             "official_name": null,
//             "subtype": "student",
//             "type": "loan"
//         },
//         {
//             "account_id": "BQxo7WZ1ZlToGjnW3pWmuBgdgAgxxPiLd6nm4",
//             "balances": {
//                 "available": null,
//                 "current": 56302.06,
//                 "iso_currency_code": "USD",
//                 "limit": null,
//                 "unofficial_currency_code": null
//             },
//             "mask": "8888",
//             "name": "Plaid Mortgage",
//             "official_name": null,
//             "subtype": "mortgage",
//             "type": "loan"
//         }
//     ],
//     "item": {
//         "available_products": [
//             "assets",
//             "balance",
//             "identity",
//             "income"
//         ],
//         "billed_products": [
//             "auth",
//             "transactions"
//         ],
//         "consent_expiration_time": null,
//         "error": null,
//         "institution_id": "ins_14",
//         "item_id": "5rEXqab3bxtz8ADwxew4sqj97ZopQgTZpE6o9",
//         "optional_products": null,
//         "products": [
//             "auth",
//             "transactions"
//         ],
//         "update_type": "background",
//         "webhook": "https://745c-2409-4042-d0a-deec-a5ea-4ac-53bc-951b.in.ngrok.io/api/v1/plaid/receive_webhook"
//     },
//     "numbers": {
//         "ach": [
//             {
//                 "account": "1111222233330000",
//                 "account_id": "MAMnkV4b4wsEarQ7eq7vuw4XBMKokqs73wVax",
//                 "routing": "011401533",
//                 "wire_routing": "021000021"
//             },
//             {
//                 "account": "1111222233331111",
//                 "account_id": "1GpAnBVKVyIGaoErbpryCX6VqzdnMpfm4Ll6R",
//                 "routing": "011401533",
//                 "wire_routing": "021000021"
//             }
//         ],
//         "bacs": [],
//         "eft": [],
//         "international": []
//     },
//     "request_id": "ayyg4IMfmzoxrVo"
// }