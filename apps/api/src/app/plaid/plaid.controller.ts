import { PrismaService } from '@ghostfolio/api/services/prisma.service';
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
import { AuthGuard } from '@nestjs/passport';
import { AccountType, Prisma } from '@prisma/client';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { CreateTokenDto } from './create-token-dto';
import { OnPlaidSuccessDto } from './on-plaid-success-dto';
import { PlaidService } from './plaid.service';

const axios = require('axios');


@Controller('plaid')
export class PlaidController {

  public constructor(
    private readonly plaidService: PlaidService,
    private readonly prismaService: PrismaService
  ) { }

  @Post('on-plaid-success-demo')
  public async createLinkTokendemo() {
    return this.plaidService.createLinkTokendemo();
  }

  // @UseGuards(AuthGuard('jwt')) 
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
      console.info(error)
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

        institution = await this.prismaService.institution.create({
          data: {
            institutionName: bodyData.institution.name,
            institutionUniqueId: bodyData.institution.institution_id,
            institutionUrl: 'https://www.plaid.com',
            platformId: platform.id
          }
        })

      }

    } catch (error) {
      console.info(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }
    console.info('-------------------------------------------------------------------------------------------')
    console.info('platform->', platform)
    console.info('-------------------------------------------------------------------------------------------')
    console.info('institution->', institution)
    // Now we have institution also
    // console.info('now we have institution ')
    // console.info(institution)

    // all  We are getting the 
    // 1. public_token <-- from client when client successfully connect with bank.
    // 2. We need to call this API - 
    //  https://{{env_url}}/item/public_token/exchange  it will return access token

    // Getting access_token from public_token
    var config = {
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
    try {
      const res = await axios(config);
      access_token = res.data.access_token;
    } catch (error) {
      console.info(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }
    // 3. Same Access token is used to get  
    // https://{{env_url}}/accounts/balance/get  balance.

    let config2 = {
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
      console.info(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    console.info('-------------------------------------------------------------------------------------------')
    console.info('bodyData.accounts->', bodyData.accounts)
    console.info('-------------------------------------------------------------------------------------------')
    console.info('plaidAccounts->', plaidAccounts)


    const userAccountsWithAccountSubTypes = await this.prismaService.account.findMany({
      where: {
        userId: bodyData.userId
      },
      include: {
        AccountSubTypes: true
      }
    })

    console.info('-------------------------------------------------------------------------------------------')
    console.info('userAccountsWithAccountSubTypes', userAccountsWithAccountSubTypes)

    const userOnlyWithAccountSubTypes = userAccountsWithAccountSubTypes.map(({ AccountSubTypes }) => {
      return (AccountSubTypes) ? AccountSubTypes : null;
    })

    console.info('-------------------------------------------------------------------------------------------')
    console.info('userOnlyWithAccountSubTypes', userOnlyWithAccountSubTypes)
    let userAccountExistCounter = 0;
    const userTotalAccountToBeUpdate = bodyData.accounts.length;

    const getData = async () => {

      return Promise.all(bodyData.accounts.map(async ({ name, subtype, type }) => {

        // Checking if exist 
        let isCurrentAccountExist = false;
        for (let i = 0; i < userOnlyWithAccountSubTypes?.length; i++) {
          if (userOnlyWithAccountSubTypes[i]) {

            const { plaidAccountSubtype, plaidAccountType } = userOnlyWithAccountSubTypes[i];

            if ((plaidAccountSubtype === subtype) && (plaidAccountType === type)) {
              isCurrentAccountExist = true;
              break;
            }

          }
        }

        if (isCurrentAccountExist) {
          // If exist, currently we are not doing anything.
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
              current_balance = plaidAccounts[i].balances.available
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
      let userFreshNewRecordCounter = userTotalAccountToBeUpdate - userAccountExistCounter;
      console.info('userAccountExistCounter->', userAccountExistCounter)
      console.info('userTotalAccountToBeUpdate->', userTotalAccountToBeUpdate)
      console.info('userFreshNewRecordCreated->', userFreshNewRecordCounter)
      console.info('Final account data to be pushed inside Macrosifter DB', data);
      return this.plaidService.onPlaidSuccess(data);
    } catch (error) {
      console.info(error)
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }


  }



}
