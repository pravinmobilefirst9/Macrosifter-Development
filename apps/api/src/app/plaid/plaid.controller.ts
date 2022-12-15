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
import { AccountType, Prisma } from '@prisma/client';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { CreateTokenDto } from './create-token-dto';
import { OnPlaidSuccessDto } from './on-plaid-success-dto';
import { PlaidService } from './plaid.service';

const axios = require('axios');


@Controller('plaid')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PlaidController {

  public constructor(
    private readonly plaidService: PlaidService,
    private readonly prismaService: PrismaService,
    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) { }

  @Post('on-plaid-success-demo')
  public async createLinkTokendemo() {
    return this.plaidService.createLinkTokendemo();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-token')
  public async createLinkToken(@Body() data: CreateTokenDto) {
    return this.plaidService.createLinkToken(data);
  }

  @Post('on-plaid-success')
  public async onPlaidSuccess(@Body() bodyData: OnPlaidSuccessDto) {
    // First finding platform id from platform table

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
          url: 'https://sandbox.plaid.com/institutions/get_by_id',
          headers: {
            'Content-Type': 'application/json',
          },
          data: data
        };

        const response = await axios(config3);

        currentInstitutionLogo = response.data.institution.logo;

        console.log('currentInstitutionLogo' + currentInstitutionLogo);


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
      url: 'https://sandbox.plaid.com/item/public_token/exchange',
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
    } catch (error) {
      console.log(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    try {

      let plaidToken = await this.prismaService.plaidToken.findFirst({
        where: {
          userId: bodyData.userId,
          AND: {
            institutionUniqueId: bodyData.institution.institution_id
          }
        }

      })

      if (plaidToken) {
        console.log('PlaidToken Entry Already Exist:', plaidToken);
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

        console.log('Created PlaidToken Entry:', plaidToken);

      }

    } catch (error) {
      console.log(error);
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }



    // 3. Same Access token is used to get  
    // https://{{env_url}}/accounts/balance/get  balance.

    const config2 = {
      method: 'post',
      url: 'https://sandbox.plaid.com/accounts/balance/get',
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
      console.log(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    console.log('bodyData->', bodyData)
    console.log('plaidAccounts->', plaidAccounts)
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

    let userAccountExistCounter = 0;
    const getData = async () => {

      return Promise.all(bodyData.accounts.map(async ({ name, subtype, type }) => {

        let isCurrentAccountExist = false;
        // console.log('isInstitutionExist', isInstitutionExist);

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
          // HERE WE CAN UPDATE CURRENT_ACCOUNT
          userAccountExistCounter++;
        } else {
          // If not exist then we are creating new account entry of Account table.
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
          let current_currency = null;

          for (let i = 0; i < plaidAccounts.length; i++) {
            if ((plaidAccounts[i].subtype === subtype) && (plaidAccounts[i].type === type)) {
              current_balance = plaidAccounts[i].balances.current
              current_currency = plaidAccounts[i].balances.iso_currency_code
            }
          }



          return {
            userId: bodyData.userId,
            accountType: accountTypeName,
            balance: current_balance,
            currency: current_currency,
            name: name,
            institutionId: institution.id,
            platformId: platform.id,
            accountSubTypeId: accountSubType.id
          }
        }

      }))

    }

    try {
      const data = await getData();
      const userFreshNewRecordCounter = bodyData.accounts.length - userAccountExistCounter;
      console.log('userAccountExistCounter->', userAccountExistCounter)
      console.log('userFreshNewRecordCreated->', userFreshNewRecordCounter)
      console.log('Final account data to be pushed inside Macrosifter DB', data);
      return this.plaidService.onPlaidSuccess(data);
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
    console.log(itemId);
    return this.plaidService.updateItemLoginRequiredStatus(itemId);
  }

}
