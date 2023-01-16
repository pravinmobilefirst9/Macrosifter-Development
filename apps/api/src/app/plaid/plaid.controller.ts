import { capitalizeFirstLetter } from '@ghostfolio/api/helper/string.helper';
import { PrismaService } from '@ghostfolio/api/services/prisma.service';
import { RequestWithUser } from '@ghostfolio/common/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Inject,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AccountType, PlaidToken, Prisma } from '@prisma/client';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { CreateTokenDto } from './create-token-dto';
import { OnPlaidSuccessDto } from './on-plaid-success-dto';
import { PlaidService } from './plaid.service';

const axios = require('axios');


@Controller('plaid')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PlaidController {

  public PLAID_BASE_URI = process.env.PLAID_BASE_URI;
  public constructor(
    private readonly plaidService: PlaidService,
    private readonly prismaService: PrismaService,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-token')
  public async createLinkToken(@Body() data: CreateTokenDto) {
    return this.plaidService.createLinkToken(data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('fetch-latest-balance')
  public async fetchLatestBalance() {
    return this.plaidService.fetchLatestBalance(this.request.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-token-two-deposit')
  public async createLinkTokenTwoDeposit(@Body() data) {
    return this.plaidService.createLinkTokenTwoDeposit(data);
  }

  @Post('on-plaid-success')
  public async onPlaidSuccess(@Body() bodyData: OnPlaidSuccessDto) {
    let platform = null;
    try {

      platform = await this.prismaService.platform.findUnique({
        where: {
          url: 'https://www.plaid.com'
        }
      })

      // if not platform then we are creating 'Plaid' platform
      if (!platform) {
        platform = await this.prismaService.platform.create({
          data: {
            url: 'https://www.plaid.com',
            name: 'Plaid',
          }
        })
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    // This is for same_day
    if (!(bodyData.institution.institution_id)) {


      const same_day_institution = await this.prismaService.institution.findFirst({
        where: {
          institutionUniqueId: 'same_day'
        }
      })

      if (!same_day_institution) {

        await this.prismaService.institution.create({
          data: {
            institutionName: "SAME_DAY",
            institutionUniqueId: 'same_day',
            institutionUrl: 'https://www.plaid.com',
            platformId: platform.id,
          }
        })


      }

      // Getting access_token from public_token
      const configSameDay = {
        method: 'post',
        url: this.PLAID_BASE_URI + '/item/public_token/exchange',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          "client_id": process.env.CLIENT_ID,
          "secret": process.env.SECRET_ID,
          "public_token": bodyData.public_token
        })
      };

      let access_token_same = null;
      let item_id_same = null;
      try {
        const res = await axios(configSameDay);
        access_token_same = res.data.access_token;
        item_id_same = res.data.item_id;
      } catch (error) {
        console.log(error)
        throw new HttpException(
          getReasonPhrase(StatusCodes.FORBIDDEN),
          StatusCodes.FORBIDDEN
        );
      }

      let plaidTokenSame


      try {

        plaidTokenSame = await this.prismaService.plaidToken.findFirst({
          where: {
            userId: bodyData.userId,
            AND: {
              institutionUniqueId: 'same_day'
            }
          }

        })

        if (plaidTokenSame) {

          await this.prismaService.plaidToken.update({
            data: {
              accessToken: access_token_same,
              itemId: item_id_same,
            },
            where: {
              id: plaidTokenSame.id
            }
          })

          const existingAccount = await this.prismaService.account.findFirst({
            where: {
              userId: bodyData.userId,
              Institution: {
                institutionUniqueId: 'same_day'
              }
            }
          })

          const updatedAccountSameDay = await this.prismaService.account.update({
            data: {
              userId: bodyData.userId,
              accountType: null,
              balance: 0,
              verification_status: bodyData.accounts[0].verification_status,
              currency: 'USD',
              plaidTokenId: plaidTokenSame.id,
              name: bodyData[0]['subtype'] + " " + bodyData[0]['type'] + " Account " + bodyData[0]['mask'],
              account_id: bodyData.accounts[0].id,
              institutionId: same_day_institution.id,
              platformId: platform.id,
              accountSubTypeId: null,
            },
            where: {
              id_userId: {
                id: existingAccount.id,
                userId: bodyData.userId,
              }
            }
          })

          return {
            status: bodyData.accounts[0].verification_status,
            statusCode: 201,
            plaidTokenSame,
          };


        } else {

          plaidTokenSame = await this.prismaService.plaidToken.create({
            data: {
              accessToken: access_token_same,
              itemId: item_id_same,
              publicToken: bodyData.public_token,
              institutionUniqueId: 'same_day',
              userId: bodyData.userId,
            }
          })

          const data = [
            {
              userId: bodyData.userId,
              accountType: null,
              balance: 0,
              verification_status: bodyData.accounts[0].verification_status,
              currency: 'USD',
              plaidTokenId: plaidTokenSame.id,
              name: capitalizeFirstLetter(bodyData[0]['subtype']) + " " + capitalizeFirstLetter(bodyData[0]['type']) + " Account (..." + bodyData[0]['mask'] + ")",
              account_id: bodyData.accounts[0].id,
              institutionId: same_day_institution.id,
              platformId: platform.id,
              accountSubTypeId: null,
            }

          ]

          return this.plaidService.onPlaidSuccess(data, plaidTokenSame);

        }

      } catch (error) {
        console.log(error);
        throw new HttpException(
          getReasonPhrase(StatusCodes.FORBIDDEN),
          StatusCodes.FORBIDDEN
        );
      }






    }



    // First finding platform id from platform table
    console.log('========================on-plaid-success-start============================================================');
    try {

      platform = await this.prismaService.platform.findUnique({
        where: {
          url: 'https://www.plaid.com'
        }
      })

      // if not platform then we are creating 'Plaid' platform
      if (!platform) {
        platform = await this.prismaService.platform.create({
          data: {
            url: 'https://www.plaid.com',
            name: 'Plaid',
          }
        })
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    let institution = null;
    try {
      institution = await this.prismaService.institution.findUnique({
        where: {
          institutionUniqueId: bodyData.institution.institution_id
        }
      })

      // if institution not found then create 
      if (!institution) {

        let currentInstitutionLogo = null;

        const data = JSON.stringify({
          "institution_id": bodyData.institution.institution_id,
          "country_codes": [
            "US"
          ],
          "client_id": process.env.CLIENT_ID,
          "secret": process.env.SECRET_ID,
          "options": {
            "include_optional_metadata": true
          }
        });

        const config3 = {
          method: 'post',
          url: this.PLAID_BASE_URI + '/institutions/get_by_id',
          headers: {
            'Content-Type': 'application/json',
          },
          data: data
        };

        const response = await axios(config3);

        currentInstitutionLogo = response.data.institution.logo;

        institution = await this.prismaService.institution.create({
          data: {
            institutionName: bodyData.institution.name,
            institutionUniqueId: bodyData.institution.institution_id,
            institutionUrl: 'https://www.plaid.com',
            platformId: platform.id,
            logo: currentInstitutionLogo,
          }
        })

      }

    } catch (error) {
      console.log(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    // Getting access_token from public_token
    const config = {
      method: 'post',
      url: this.PLAID_BASE_URI + '/item/public_token/exchange',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        "client_id": process.env.CLIENT_ID,
        "secret": process.env.SECRET_ID,
        "public_token": bodyData.public_token
      })
    };

    let access_token = null;
    let item_id = null;
    try {
      const res = await axios(config);
      access_token = res.data.access_token;
      item_id = res.data.item_id;
      console.log('access_token', access_token);
      console.log('item_id', item_id);

    } catch (error) {
      console.log(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    let plaidToken: PlaidToken;

    try {

      plaidToken = await this.prismaService.plaidToken.findFirst({
        where: {
          userId: bodyData.userId,
          AND: {
            institutionUniqueId: bodyData.institution.institution_id
          }
        }

      })

      if (plaidToken) {
      } else {

        plaidToken = await this.prismaService.plaidToken.create({
          data: {
            accessToken: access_token,
            itemId: item_id,
            publicToken: bodyData.public_token,
            institutionUniqueId: bodyData.institution.institution_id,
            userId: bodyData.userId,
          }
        })


      }

    } catch (error) {
      console.log(error);
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    const config2 = {
      method: 'post',
      url: this.PLAID_BASE_URI + '/accounts/balance/get',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        "client_id": process.env.CLIENT_ID,
        "secret": process.env.SECRET_ID,
        "access_token": access_token
      })
    };

    let plaidAccounts = null;
    try {
      const res = await axios(config2);
      plaidAccounts = res.data.accounts;
    } catch (error) {
      return {
        status: error['response']['data']['error_code'],
        statusCode: 201,
        plaidToken: null,
        access_token: access_token,
        item_id: item_id
      };
    }

    let isInstitutionExist = false;
    const institutionNew = await this.prismaService.institution.findUnique({
      where: {
        institutionUniqueId: bodyData.institution.institution_id
      }
    })

    let userAccountsWithAccountSubTypes;
    if (institutionNew) {
      isInstitutionExist = true;
      userAccountsWithAccountSubTypes = await this.prismaService.account.findMany({
        where: {
          userId: bodyData.userId,
          institutionId: institutionNew.id
        },
        include: {
          AccountSubTypes: true
        }
      })


    } else {
      isInstitutionExist = false;
    }

    const userOnlyWithAccountSubTypes = userAccountsWithAccountSubTypes.map(({ AccountSubTypes }) => {
      return (AccountSubTypes) ? AccountSubTypes : null;
    })


    const getData = async () => {

      return Promise.all(bodyData.accounts.map(async ({ name, subtype, id, type }) => {

        let isCurrentAccountExist = false;

        if (isInstitutionExist) {

          for (let i = 0; i < userOnlyWithAccountSubTypes?.length; i++) {
            if (userOnlyWithAccountSubTypes[i]) {

              const { plaidAccountSubtype, plaidAccountType } = userOnlyWithAccountSubTypes[i];


              if (((plaidAccountSubtype === subtype) && (plaidAccountType === type))) {
                isCurrentAccountExist = true;
                console.log("NOT EXIST BOTH TYPE AND SUBTYPE");
                break;
              }

            }
          }
        }


        if (isCurrentAccountExist) {

        } else {
          const accountSubType = await this.prismaService.accountSubTypes.findFirst({
            where: {
              plaidAccountSubtype: subtype,
              plaidAccountType: type
            }
          })

          const { accountTypeName } = await this.prismaService.accountTypes.findUnique({
            where: {
              id: accountSubType.accountTypeId
            },
            select: {
              accountTypeName: true
            }
          })

          let current_balance = 0;
          let verification_status = '';
          let account_id = '';
          let current_currency = null;
          let account_name = null;

          for (let i = 0; i < plaidAccounts.length; i++) {
            if ((plaidAccounts[i].subtype === subtype) && (plaidAccounts[i].type === type) && (plaidAccounts[i].account_id === id)) {
              current_balance = (plaidAccounts[i]['type'] === 'investment') ? 0 : plaidAccounts[i].balances.current
              current_currency = plaidAccounts[i].balances.iso_currency_code
              account_id = plaidAccounts[i].account_id
              account_name = capitalizeFirstLetter(plaidAccounts[i]['subtype']) + " " + capitalizeFirstLetter(plaidAccounts[i]['type']) + " Account (..." + plaidAccounts[i]['mask'] + ")"
              verification_status = plaidAccounts[i].verification_status ? plaidAccounts[i].verification_status : ''
            }
          }


          return {
            userId: bodyData.userId,
            accountType: accountTypeName,
            balance: current_balance,
            verification_status,
            currency: current_currency,
            name: account_name,
            plaidTokenId: plaidToken.id,
            account_id,
            institutionId: institution.id,
            platformId: platform.id,
            accountSubTypeId: accountSubType.id
          }
        }

      }))

    }

    try {
      const data = await getData();
      console.log('Final account data to be pushed inside Macrosifter DB', data);

      console.log('========================on-plaid-success-end============================================================');
      // return {
      //   status: 'success',
      //   statusCode: 201,
      //   plaidToken,
      //   msg: 'account is verified with plaid we are importing account details'
      // };

      return this.plaidService.onPlaidSuccess(data, plaidToken);
    } catch (error) {
      console.log(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }


  }

  @Post('receive_webhook')
  public async receiveWebhook(@Body() bodyData) {
    console.log('Webhook Received.........');
    console.log('Webhook BodyData', bodyData);
    const product = bodyData.webhook_type;
    const code = bodyData.webhook_code;
    switch (product) {
      case "ITEM":
        this.plaidService.handleItemWebhook(code, bodyData);
        break;
      case "AUTH":
        this.plaidService.handleAuthWebhook(code, bodyData);
        break;
      // case "ASSETS":
      //   handleAssetsWebhook(code, bodyData);
      //   break;
      // case "TRANSACTIONS":
      //   handleTransactionsWebhook(code, bodyData);
      //   break;
      default:
        console.log(`Can't handle webhook product ${product}`);
        break;
    }
    return { status: 'received-webhook!' }
  }

  @Get('get-plaid-messages')
  @UseGuards(AuthGuard('jwt'))
  public async getPlaidMessages() {
    return this.plaidService.getPlaidMessages(this.request.user.id);
  }

  @Post('update-item-login-required-status/:itemId')
  @UseGuards(AuthGuard('jwt'))
  public async updateItemLoginRequiredStatus(@Param('itemId') itemId: string) {
    return this.plaidService.updateItemLoginRequiredStatus(itemId);
  }

  @Post('update-manual-two-deposit-status')
  @UseGuards(AuthGuard('jwt'))
  public async updateManualTwoDepositStatus(@Body() bodyData: any) {
    return this.plaidService.updateManualTwoDepositStatus(bodyData);
  }

}
