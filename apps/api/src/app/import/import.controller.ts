import { ConfigurationService } from '@ghostfolio/api/services/configuration.service';
import { DataGatheringService } from '@ghostfolio/api/services/data-gathering.service';
import { PrismaService } from '@ghostfolio/api/services/prisma.service';
import type { RequestWithUser } from '@ghostfolio/common/types';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Prisma } from '@prisma/client';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { ImportDataDto } from './import-data.dto';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
  public constructor(
    private readonly configurationService: ConfigurationService,
    private readonly importService: ImportService,
    private readonly dataGatheringService: DataGatheringService,
    private readonly prismaService: PrismaService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) { }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  public async import(@Body() importData: ImportDataDto): Promise<void> {
    if (!this.configurationService.get('ENABLE_FEATURE_IMPORT')) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    let maxActivitiesToImport = this.configurationService.get(
      'MAX_ACTIVITIES_TO_IMPORT'
    );

    if (
      this.configurationService.get('ENABLE_FEATURE_SUBSCRIPTION') &&
      this.request.user.subscription.type === 'Premium'
    ) {
      maxActivitiesToImport = Number.MAX_SAFE_INTEGER;
    }

    try {
      return await this.importService.import({
        maxActivitiesToImport,
        activities: importData.activities,
        userId: this.request.user.id
      });
    } catch (error) {
      Logger.error(error, ImportController);

      throw new HttpException(
        {
          error: getReasonPhrase(StatusCodes.BAD_REQUEST),
          message: [error.message]
        },
        StatusCodes.BAD_REQUEST
      );
    }
  }

  @Post('csv')
  @UseGuards(AuthGuard('jwt'))
  public async importCSV(@Body() bodyData, @Res() res: Response) {
    try {

      console.log(bodyData);


      if (bodyData && bodyData.length !== 0) {

        const orders = []

        for (let i = 0; i < bodyData.length; i++) {

          if (!(Object.prototype.hasOwnProperty.call(bodyData[i], "TRANSACTION ID"))) {
            continue;
          }

          if (!(bodyData[i]["SYMBOL"])) {
            continue;
          }

          console.log('Symbol =>', bodyData[i]['SYMBOL']);

          const description = bodyData[i]['DESCRIPTION'];

          if (description.includes('ELECTRONIC NEW ACCOUNT FUNDING')) {
            continue;
          }

          if (description.includes('ELECTRONIC NEW ACCOUNT FUNDING')) {
            continue;
          }

          if (description.includes('INTRA-ACCOUNT TRANSFER') || description.includes('CLIENT REQUESTED ELECTRONIC FUNDING RECEIPT (FUNDS NOW)') ||
            description.includes('ACH') || description.includes('INTERNAL TRANSFER BETWEEN ACCOUNTS OR ACCOUNT TYPES') || description.includes('MISCELLANEOUS JOURNAL ENTRY') || description.includes('CLIENT REQUESTED ELECTRONIC FUNDING DISBURSEMENT (FUNDS NOW)')
          ) {
            continue;
          }




          let type = null;
          let subtype = null;
          let comment = null;

          if (description.includes('Bought')) {
            type = 'BUY'
          } else if (description.includes('DIVIDEND')) {
            type = 'DIVIDEND'
          } else if (description.includes('Sold')) {
            type = 'SELL'
          } else {
            type = 'ITEM'
          }


          if (description.includes('FREE BALANCE INTEREST ADJUSTMENT')) {
            type = 'CASH'
            subtype = 'INTEST'
            comment = 'FREE BALANCE INTEREST ADJUSTMENT'
          }
          if (description.includes('OFF-CYCLE INTEREST (MMDA10)')) {
            type = 'CASH'
            subtype = 'INTEST'
            comment = 'OFF-CYCLE INTEREST (MMDA10)'
          }

          if (description.includes('REBATE')) {
            type = 'CASH'
            subtype = 'DEPOSIT'
            comment = 'REBATE'
          }

          if (description.includes('MANDATORY - NAME CHANGE')) {
            type = 'TRANSFER'
            subtype = 'TRANSFER'
            comment = 'MANDATORY - NAME CHANGE'
          }

          if (description.includes('MARGIN INTEREST ADJUSTMENT')) {
            type = 'FEES'
            subtype = 'Margin Expense'
            comment = 'MARGIN INTEREST ADJUSTMENT'
          }





          const symbolProfileId = await this.dataGatheringService.getSymbolProfileId(bodyData[i]['SYMBOL']);
          const dividendpershare_at_cost = await this.dataGatheringService.getDividendpershareAtCost(bodyData[i]['SYMBOL'], new Date(bodyData[i]['DATE']));

          let fee = 0;

          if (bodyData[i]['REG FEE']) {
            fee += bodyData[i]['REG FEE'];
          }
          if (bodyData[i]['SHORT-TERM RDM FEE']) {
            fee += bodyData[i]['SHORT-TERM RDM FEE'];
          }
          if (bodyData[i]['FUND REDEMPTION FEE']) {
            fee += bodyData[i]['FUND REDEMPTION FEE'];
          }


          const obj = {

            date: new Date(bodyData[i]['DATE']),
            fee,
            quantity: bodyData[i]['QUANTITY'] ? bodyData[i]['QUANTITY'] : 0,
            type,
            unitPrice: bodyData[i]['PRICE'] ? bodyData[i]['PRICE'] : 0,
            dividendpershare_at_cost,
            userId: this.request.user.id,
            symbolProfileId,
            subtype,
            comment,

          }


          orders.push(obj);

        }

        try {

          const result = await this.prismaService.order.createMany({
            data: [
              ...orders
            ],
            skipDuplicates: true
          })
          console.log('imported csv successfully!');
          return res.status(HttpStatus.CREATED).json({ msg: 'imported csv successfully!' })
        } catch (error) {
          console.log(error);
          return res.status(HttpStatus.BAD_REQUEST).json({ error: true, msg: 'Import Failed 2!' });
        }

      }

    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: true, msg: 'Import Failed 3!' });
    }
  }

}
