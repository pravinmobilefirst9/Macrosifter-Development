import { AccountService } from '@ghostfolio/api/app/account/account.service';
import { CreateOrderDto } from '@ghostfolio/api/app/order/create-order.dto';
import { OrderService } from '@ghostfolio/api/app/order/order.service';
import { ConfigurationService } from '@ghostfolio/api/services/configuration.service';
import { DataGatheringService } from '@ghostfolio/api/services/data-gathering.service';
import { DataProviderService } from '@ghostfolio/api/services/data-provider/data-provider.service';
import { PrismaService } from '@ghostfolio/api/services/prisma.service';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { isSameDay, parseISO } from 'date-fns';
import { REQUEST } from '@nestjs/core';
import { RequestWithUser } from '@ghostfolio/common/types';
import { v4 as uuidv4 } from 'uuid';
import { getDateWithTimeFormatString } from '../../../../../libs/common/src/lib/helper';

@Injectable()
export class ImportService {
  public constructor(
    private readonly accountService: AccountService,
    private readonly configurationService: ConfigurationService,
    private readonly dataProviderService: DataProviderService,
    private readonly orderService: OrderService,
    private readonly dataGatheringService: DataGatheringService,
    private readonly prismaService: PrismaService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) { }

  public async import({
    activities,
    maxActivitiesToImport,
    userId
  }: {
    activities: Partial<CreateOrderDto>[];
    maxActivitiesToImport: number;
    userId: string;
  }): Promise<void> {
    for (const activity of activities) {
      if (!activity.dataSource) {
        if (activity.type === 'ITEM') {
          activity.dataSource = 'MANUAL';
        } else {
          activity.dataSource = this.dataProviderService.getPrimaryDataSource();
        }
      }
    }

    await this.validateActivities({
      activities,
      maxActivitiesToImport,
      userId
    });

    const accountIds = (await this.accountService.getAccounts(userId)).map(
      (account) => {
        return account.id;
      }
    );

    for (const {
      accountId,
      comment,
      currency,
      dataSource,
      date,
      fee,
      quantity,
      symbol,
      type,
      unitPrice
    } of activities) {
      await this.orderService.createOrder({
        comment,
        fee,
        quantity,
        type,
        unitPrice,
        userId,
        accountId: accountIds.includes(accountId) ? accountId : undefined,
        date: parseISO(<string>(<unknown>date)),
        SymbolProfile: {
          connectOrCreate: {
            create: {
              currency,
              dataSource,
              symbol
            },
            where: {
              dataSource_symbol: {
                dataSource,
                symbol
              }
            }
          }
        },
        User: { connect: { id: userId } }
      });
    }
  }

  public async getActivitySubTypeId(subtype) {
    try {

      const data = await this.prismaService.activitySubType.findFirst({
        where: {
          subtype,
        }
      })

      return (data && data.id) ? data.id : null;

    } catch (error) {
      return null;
    }

  }

  public async isDuplicateActivity(bodyData) {
    try {

      const order = await this.prismaService.order.findFirst({
        where: {
          userId: this.request.user.id,
          transactionId: bodyData['TRANSACTION ID']
        }
      })

      return order ? true : false;

    } catch (error) {
      console.log(error);
      return true;
    }
  }

  public isCSVFileOK(bodyData) {
    console.log(bodyData);

    if ((!bodyData) && bodyData.length === 0) {
      return false;
    }
    return true;
  }

  public async importCSV(bodyData, res) {

    try {

      if (!(this.isCSVFileOK(bodyData))) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: true, msg: 'CSV FORMAT ERROR!' });
      }

      if (bodyData && bodyData.length !== 0) {
        const orders = [];
        const symbols = [];

        for (let i = 0; i < bodyData.length; i++) {

          if (!(bodyData[i]['TRANSACTION ID'])) {
            continue;
          }

          bodyData[i]['TRANSACTION ID'] = bodyData[i]['TRANSACTION ID'].toString()

          if (await this.isDuplicateActivity(bodyData[i])) {
            console.log('SKipped - ', bodyData[i]['SYMBOL']);
            continue;
          }
          if (!(Object.prototype.hasOwnProperty.call(bodyData[i], "TRANSACTION ID"))) {
            continue;
          }
          console.log('Symbol =>', bodyData[i]['SYMBOL']);

          const description = bodyData[i]['DESCRIPTION'] ? bodyData[i]['DESCRIPTION'] : null;
          if (!(description)) {
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
            subtype = await this.getActivitySubTypeId('Buy')
            if (bodyData[i]['SYMBOL'] === 'CSCO') {
              subtype = await this.getActivitySubTypeId('Qualified Dividend Reinvestment')
            }
            if (bodyData[i]['SYMBOL'] === 'PBA') {
              subtype = await this.getActivitySubTypeId('Qualified Dividend Reinvestment')
            }
          } else if (description.includes('DIVIDEND')) {
            type = 'DIVIDEND'
            subtype = await this.getActivitySubTypeId('Ordinary Dividend')
          } else if (description.includes('Sold')) {
            type = 'SELL'
            subtype = await this.getActivitySubTypeId('Sell')
          } else {
            type = 'ITEM'
            subtype = await this.getActivitySubTypeId('ITEM')
          }


          if (description.includes('FREE BALANCE INTEREST ADJUSTMENT')) {
            type = 'CASH'
            subtype = await this.getActivitySubTypeId('INTEST')
            comment = 'FREE BALANCE INTEREST ADJUSTMENT'
          }
          if (description.includes('OFF-CYCLE INTEREST (MMDA10)')) {
            type = 'CASH'
            subtype = await this.getActivitySubTypeId('INTEST')
            comment = 'OFF-CYCLE INTEREST (MMDA10)'
          }

          if (description.includes('REBATE')) {
            type = 'CASH'
            subtype = await this.getActivitySubTypeId('DEPOSIT')
            comment = 'REBATE'
          }

          if (description.includes('MANDATORY - NAME CHANGE')) {
            type = 'TRANSFER'
            subtype = await this.getActivitySubTypeId('TRANSFER')
            comment = 'MANDATORY - NAME CHANGE'
          }

          if (description.includes('MARGIN INTEREST ADJUSTMENT')) {
            type = 'FEES'
            subtype = await this.getActivitySubTypeId('Margin Expense')
            comment = 'MARGIN INTEREST ADJUSTMENT'
          }

          const symbolProfileId = ((bodyData[i]["SYMBOL"])) ? await this.dataGatheringService.getSymbolProfileId(bodyData[i]['SYMBOL']) : null;
          const dividendpershare_at_cost = ((bodyData[i]["SYMBOL"])) ? await this.dataGatheringService.getDividendpershareAtCost(bodyData[i]['SYMBOL'], new Date(bodyData[i]['DATE'])) : null;


          if (description && description.includes('QUALIFIED DIVIDEND')) {
            type = 'DIVIDEND';
            subtype = await this.getActivitySubTypeId('Qualified Dividend')
            comment = description;
          }

          if (description && description.includes('Foreign Tax Withheld')) {
            type = 'FEES';
            subtype = await this.getActivitySubTypeId('Foreign Tax Withheld')
          }
          if (description && description.includes('FOREIGN TAX WITHHELD')) {
            type = 'FEES';
            subtype = await this.getActivitySubTypeId('Foreign Tax Withheld')
          }

          comment = description;

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

          if (bodyData[i]['COMMISSION']) {
            fee += bodyData[i]['COMMISSION'];
          }

          if (bodyData[i]["SYMBOL"]) {
            symbols.push(bodyData[i]["SYMBOL"]);
          }

          const date = parseISO(bodyData[i]['DATE'])

          const obj = {

            date: date,
            fee,
            quantity: bodyData[i]['QUANTITY'] ? bodyData[i]['QUANTITY'] : 1,
            type,
            unitPrice: bodyData[i]['PRICE'] ? bodyData[i]['PRICE'] : bodyData[i]['AMOUNT'],
            dividendpershare_at_cost,
            userId: this.request.user.id,
            accountUserId: this.request.user.id,
            symbolProfileId,
            subtype,
            comment,
            transactionId: bodyData[i]['TRANSACTION ID']

          }


          if (!(bodyData[i]['SYMBOL'])) {

            type = 'CASH';
            subtype = await this.getActivitySubTypeId('Deposit')
            comment = description;
            const id = uuidv4();

            await this.prismaService.order.create({
              data: {
                date: date,
                fee,
                quantity: bodyData[i]['QUANTITY'] ? bodyData[i]['QUANTITY'] : 1,
                type,
                subtype,
                unitPrice: bodyData[i]['PRICE'] ? bodyData[i]['PRICE'] : bodyData[i]['AMOUNT'],
                transactionId: bodyData[i]['TRANSACTION ID'],
                comment,
                User: {
                  connect: {
                    id: this.request.user.id
                  }
                },
                SymbolProfile: {
                  create: {
                    currency: 'USD',
                    dataSource: 'MANUAL',
                    symbol: id,
                  }
                }
              }
            })


            continue;
          }


          orders.push(obj);

        }

        try {

          await this.prismaService.order.createMany({
            data: [
              ...orders
            ],
            skipDuplicates: true
          })
          // Gathering SymbolProfile Table Data
          for (let i = 0; i < symbols.length; i++) {

            this.dataGatheringService.gatherAssetProfiles([{
              dataSource: 'YAHOO',
              symbol: symbols[i]
            }]);

            this.dataGatheringService.gatherHistoricalMarketData(
              { dataSource: 'YAHOO', date: new Date('01-01-2010').toISOString(), symbol: symbols[i] }
            )

          }
          console.log('imported csv successfully!');
          return res.status(HttpStatus.CREATED).json({ msg: 'imported csv successfully!' })
        } catch (error) {
          console.log(error);
          return res.status(HttpStatus.BAD_REQUEST).json({ error: true, msg: 'Import Failed 2!' });
        }

      }

    } catch (error) {
      console.log(error);
      return res.status(HttpStatus.BAD_REQUEST).json({ error: true, msg: 'CSV FORMAT ERROR!' });
    }
  }

  private async validateActivities({
    activities,
    maxActivitiesToImport,
    userId
  }: {
    activities: Partial<CreateOrderDto>[];
    maxActivitiesToImport: number;
    userId: string;
  }) {
    if (activities?.length > maxActivitiesToImport) {
      throw new Error(`Too many activities (${maxActivitiesToImport} at most)`);
    }

    const existingActivities = await this.orderService.orders({
      include: { SymbolProfile: true },
      orderBy: { date: 'desc' },
      where: { userId }
    });

    for (const [
      index,
      { currency, dataSource, date, fee, quantity, symbol, type, unitPrice }
    ] of activities.entries()) {
      const duplicateActivity = existingActivities.find((activity) => {
        return (
          activity.SymbolProfile.currency === currency &&
          activity.SymbolProfile.dataSource === dataSource &&
          isSameDay(activity.date, parseISO(<string>(<unknown>date))) &&
          activity.fee === fee &&
          activity.quantity === quantity &&
          activity.SymbolProfile.symbol === symbol &&
          activity.type === type &&
          activity.unitPrice === unitPrice
        );
      });

      if (duplicateActivity) {
        throw new Error(`activities.${index} is a duplicate activity`);
      }

      if (dataSource !== 'MANUAL') {
        const quotes = await this.dataProviderService.getQuotes([
          { dataSource, symbol }
        ]);

        if (quotes[symbol] === undefined) {
          throw new Error(
            `activities.${index}.symbol ("${symbol}") is not valid for the specified data source ("${dataSource}")`
          );
        }

        if (quotes[symbol].currency !== currency) {
          throw new Error(
            `activities.${index}.currency ("${currency}") does not match with "${quotes[symbol].currency}"`
          );
        }
      }
    }
  }
}
