import { DataGatheringService } from '../../services/data-gathering.service';
import { PrismaService } from '../../services/prisma.service';
import {
  GATHER_ASSET_PROFILE_PROCESS,
  GATHER_ASSET_PROFILE_PROCESS_OPTIONS,
  GATHER_HISTORICAL_MARKET_DATA_PROCESS,
  GATHER_HISTORICAL_MARKET_DATA_PROCESS_OPTIONS
} from '@ghostfolio/common/config';
import { Injectable, Logger } from '@nestjs/common';
import { parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { groupBy } from 'lodash';

@Injectable()
export class CSVService {
  constructor(
    public readonly dataGatheringService: DataGatheringService,
    public readonly prismaService: PrismaService
  ) { }

  public async updateCSVOrder(
    csv_data,
    fileName,
    userId,
    accountId,
    institutionId
  ) {
    try {
      const orderCSV = await this.prismaService.orderCSV.findFirst({
        where: {
          userId: userId,
          accountId: accountId,
          fileName: fileName,
          institutionId: institutionId
        }
      });

      if (orderCSV && orderCSV.status === 'IN_PROGRESS') {
        await this.prismaService.orderCSV.update({
          where: {
            id: orderCSV.id
          },
          data: {
            completedOrder: {
              increment: csv_data.length
            },
            status:
              orderCSV.completedOrder + csv_data.length === orderCSV.totalOrder
                ? 'COMPLETED'
                : 'IN_PROGRESS'
          }
        });

        if (orderCSV.completedOrder + csv_data.length === orderCSV.totalOrder) {
          await this.dataGatheringService.gatherDividendData();
          await this.updateDividendPershareAtCost();
          // Gathering SymbolProfile Table Data
          const uniqueAssets =
            await this.dataGatheringService.getUniqueAssets();
          for (const { dataSource, symbol } of uniqueAssets) {
            console.log('Symbol Profile job add to queue');

            await this.dataGatheringService.addJobToQueue(
              GATHER_ASSET_PROFILE_PROCESS,
              {
                dataSource,
                symbol
              },
              GATHER_ASSET_PROFILE_PROCESS_OPTIONS
            );

            // MarkerData Table Data
            if (dataSource === 'MANUAL') {
              continue;
            }
            console.log('Market Data job add to queue');
            await this.dataGatheringService.addJobToQueue(
              GATHER_HISTORICAL_MARKET_DATA_PROCESS,
              {
                dataSource,
                date: new Date('01-01-2000').toISOString(),
                symbol
              },
              GATHER_HISTORICAL_MARKET_DATA_PROCESS_OPTIONS
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  public async isDuplicateActivity(csv_data, userId) {
    try {
      const isOrderExist = await this.prismaService.order.findFirst({
        where: {
          userId: userId,
          transactionId: csv_data['TRANSACTION ID']
        }
      });

      return isOrderExist ? true : false;
    } catch (error) {
      return false;
    }
  }

  public async getActivitySubTypeId(subtype, type = null) {
    try {
      let data = null;
      if (type) {
        data = await this.prismaService.activitySubType.findFirst({
          where: {
            subtype,
            type
          }
        });
      } else {
        data = await this.prismaService.activitySubType.findFirst({
          where: {
            subtype
          }
        });
      }

      return data && data.id ? data.id : null;
    } catch (error) {
      return null;
    }
  }

  public getCCN(str) {

    const MonthsArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const digitOfMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

    let ccn = '';

    ccn += str.split(' ')[0]
    let year = str.split(' ')[3]

    year = year.slice(2, 4)

    ccn += year;

    ccn += digitOfMonths[MonthsArray.findIndex((value, index) => {
      return str.split(' ')['1'] === value
    })]

    ccn += str.split(' ')[2];

    ccn += str.split(' ')[5] === 'Call' ? 'C' : 'P'

    let number1 = str.split(' ')[4]
    number1 = String(number1).split('.')[0]
    number1 = String(number1).split('')

    let temp = ['0', '0', '0', '0', '0']

    let j = temp.length - 1;
    for (let i = number1.length - 1; i >= 0; i--) {
      temp[j--] = number1[i]
    }

    for (let i = 0; i < temp.length; i++) {
      ccn += temp[i]
    }

    temp = ['0', '0', '0']
    number1 = str.split(' ')[4].split('.')[1]
    number1 = Array(number1)

    for (let i = 0; i < number1.length; i++) {
      temp[i] = number1[i]
    }
    for (let i = 0; i < temp.length; i++) {
      ccn += temp[i]
    }

    return ccn;
  }

  public async isSubTypeOrdinaryDividendReinvestment(
    order,
    symbol,
    csv_data,
    date
  ) {
    const data = csv_data.filter((e) => {
      return (
        (e['DESCRIPTION'].includes('FOREIGN TAX WITHHELD') ||
          e['DESCRIPTION'].includes('ORDINARY DIVIDEND')) &&
        date === e['DATE'] &&
        symbol === e['SYMBOL']
      );
    });

    let amount = 0;
    data.forEach((e) => (amount += e['AMOUNT']));
    return Math.floor(amount + order['AMOUNT']) === 0 ? true : false;
  }

  public async isSubTypePartnershipDistribution(order, symbol, csv_data, date) {
    const data = csv_data.filter((e) => {
      return (
        e['DESCRIPTION'].includes('PARTNERSHIP DISTRIBUTION') &&
        date === e['DATE'] &&
        symbol === e['SYMBOL']
      );
    });

    let amount = 0;
    data.forEach((e) => (amount += e['AMOUNT']));
    return Math.floor(amount + order['AMOUNT']) === 0 ? true : false;
  }

  public async isSubTypeLongTermCapitalGainReinvestment(
    order,
    symbol,
    csv_data,
    date
  ) {
    const data = csv_data.filter((e) => {
      return (
        e['DESCRIPTION'].includes('LONG TERM GAIN DISTRIBUTION') &&
        date === e['DATE'] &&
        symbol === e['SYMBOL']
      );
    });

    let amount = 0;
    data.forEach((e) => (amount += e['AMOUNT']));
    return Math.floor(amount + order['AMOUNT']) === 0 ? true : false;
  }

  public async isSubTypeShortTermCapitalGainReinvestment(
    order,
    symbol,
    csv_data,
    date
  ) {
    const data = csv_data.filter((e) => {
      return (
        e['DESCRIPTION'].includes('SHORT TERM CAPITAL GAINS') &&
        date === e['DATE'] &&
        symbol === e['SYMBOL']
      );
    });

    let amount = 0;
    data.forEach((e) => (amount += e['AMOUNT']));
    return Math.floor(amount + order['AMOUNT']) === 0 ? true : false;
  }

  public async isSubTypeQualifiedDividendReinvestment(
    order,
    symbol,
    csv_data,
    date
  ) {
    const data = csv_data.filter((e) => {
      return (
        (e['DESCRIPTION'].includes('ADR FEE') ||
          e['DESCRIPTION'].includes('FOREIGN TAX WITHHELD') ||
          e['DESCRIPTION'].includes('QUALIFIED DIVIDEND')) &&
        date === e['DATE'] &&
        symbol === e['SYMBOL']
      );
    });

    let amount = 0;
    data.forEach((e) => (amount += e['AMOUNT']));
    return Math.floor(amount + order['AMOUNT']) === 0 ? true : false;
  }

  public async getSymbolProfileIdForCCNSSymbol(symbol, name) {
    try {

      const isSymbol = await this.prismaService.symbolProfile.findFirst({
        where: {
          symbol,
        }
      })

      if (isSymbol) {
        return isSymbol.id;
      } else {

        const newSymbol = await this.prismaService.symbolProfile.create({
          data: {
            symbol,
            currency: 'USD',
            dataSource: 'YAHOO',
            assetClass: 'EQUITY',
            assetSubClass: "DERIVATIVES",
            name: name,
          }
        })

        return newSymbol.id;
      }

    } catch (error) {
      console.log('getting errors', error);

      return undefined;

    }
  }

  // public getSymbolName(str) {
  //   str = str.split(' ')
  //   str = str.slice(2, 8)
  //   let temp = ''
  //   for (let i = 0; i < str.length; i++) {
  //     temp += str[i] + " "
  //   }
  //   return temp;
  // }


  public async uploadCSV(data: {
    institutionId: string;
    accountId: string;
    csv_data: { any }[];
    userId: string;
    fileName: string;
    symbol: string;
  }): Promise<void> {
    let { accountId, csv_data, fileName, institutionId, symbol, userId } = data;

    if (!csv_data || csv_data.length === 0) {
      return;
    }

    if (symbol === 'FB') {
      symbol = 'META';
    }

    if (symbol === 'null') {
      symbol = null;
    }

    let type = null;
    let subtype = null;
    let comment = null;

    let isCCNSymbol = false;
    if (symbol && symbol.includes('Call')) {
      symbol = this.getCCN(symbol)
      isCCNSymbol = true;

    } else if (symbol && symbol.includes('Put')) {
      symbol = this.getCCN(symbol)
      isCCNSymbol = true;

    }



    let symbolProfileId = null;
    if (isCCNSymbol) {
      symbolProfileId = await this.getSymbolProfileIdForCCNSSymbol(symbol, csv_data[0]['SYMBOL'])
    } else {


      symbolProfileId = symbol
        ? await this.dataGatheringService.getSymbolProfileId(symbol)
        : undefined;

    }

    for (const order of csv_data) {
      if (!order['TRANSACTION ID']) {
        continue;
      }

      if (!Object.prototype.hasOwnProperty.call(order, 'TRANSACTION ID')) {
        continue;
      }

      order['TRANSACTION ID'] = order['TRANSACTION ID'].toString();
      const description = order['DESCRIPTION'] ? order['DESCRIPTION'] : null;

      if (await this.isDuplicateActivity(order, userId)) {
        continue;
      }
      if (!description) {
        continue;
      }

      if (description.includes('ELECTRONIC NEW ACCOUNT FUNDING')) {
        continue;
      }

      if (description.includes('REMOVAL OF OPTION DUE TO ASSIGNMENT')) {
        continue;
      }

      if (description.includes('REMOVAL OF OPTION DUE TO EXPIRATION')) {
        continue;
      }

      if (
        description.includes('INTRA-ACCOUNT TRANSFER') ||
        description.includes(
          'CLIENT REQUESTED ELECTRONIC FUNDING RECEIPT (FUNDS NOW)'
        ) ||
        description.includes('ACH') ||
        description.includes(
          'INTERNAL TRANSFER BETWEEN ACCOUNTS OR ACCOUNT TYPES'
        ) ||
        description.includes('MISCELLANEOUS JOURNAL ENTRY') ||
        description.includes(
          'CLIENT REQUESTED ELECTRONIC FUNDING DISBURSEMENT (FUNDS NOW)'
        )
      ) {
        continue;
      }



      if (description.includes('313747206')) {
        symbol = 'FRT';
        symbolProfileId = symbol
          ? await this.dataGatheringService.getSymbolProfileId(symbol)
          : undefined;
      }

      if (description.includes('Bought')) {
        type = 'BUY';

        if (
          await this.isSubTypeOrdinaryDividendReinvestment(
            order,
            symbol,
            csv_data,
            order['DATE']
          )
        ) {
          subtype = await this.getActivitySubTypeId(
            'Ordinary Dividend Reinvestment',
            'BUY'
          );
        } else if (
          await this.isSubTypePartnershipDistribution(
            order,
            symbol,
            csv_data,
            order['DATE']
          )
        ) {
          subtype = await this.getActivitySubTypeId(
            'Partnership Distribution Reinvestment',
            'BUY'
          );
        } else if (
          await this.isSubTypeLongTermCapitalGainReinvestment(
            order,
            symbol,
            csv_data,
            order['DATE']
          )
        ) {
          subtype = await this.getActivitySubTypeId(
            'Long Term Capital Gain Reinvestment',
            type
          );
        } else if (
          await this.isSubTypeShortTermCapitalGainReinvestment(
            order,
            symbol,
            csv_data,
            order['DATE']
          )
        ) {
          subtype = await this.getActivitySubTypeId(
            'Short Term Capital Gain Reinvestment',
            type
          );
        } else if (
          await this.isSubTypeQualifiedDividendReinvestment(
            order,
            symbol,
            csv_data,
            order['DATE']
          )
        ) {
          subtype = await this.getActivitySubTypeId(
            'Qualified Dividend Reinvestment',
            type
          );
        } else {
          subtype = await this.getActivitySubTypeId('Buy');
        }

        if (csv_data['SYMBOL'] === 'CSCO') {
          subtype = await this.getActivitySubTypeId(
            'Qualified Dividend Reinvestment'
          );
        }
        if (csv_data['SYMBOL'] === 'PBA') {
          subtype = await this.getActivitySubTypeId(
            'Qualified Dividend Reinvestment'
          );
        }
      } else if (description.includes('DIVIDEND')) {
        type = 'DIVIDEND';
        subtype = await this.getActivitySubTypeId('Ordinary Dividend');
      } else if (description.includes('Sold')) {
        type = 'SELL';
        subtype = await this.getActivitySubTypeId('Sell');
      } else {
        type = 'ITEM';
        subtype = await this.getActivitySubTypeId('ITEM');
      }

      if (description.includes('FREE BALANCE INTEREST ADJUSTMENT')) {
        //1
        type = 'CASH';
        subtype = await this.getActivitySubTypeId('Interest', type);
        comment = 'FREE BALANCE INTEREST ADJUSTMENT';
      } else if (description.includes('OFF-CYCLE INTEREST (MMDA')) {
        //2
        type = 'CASH';
        subtype = await this.getActivitySubTypeId('Interest', type);
        comment = description;
        symbol = null;
      } else if (description.includes('REBATE')) {
        //3
        type = 'CASH';
        subtype = await this.getActivitySubTypeId('DEPOSIT', type);
        comment = 'REBATE';
      } else if (description.includes('MANDATORY - NAME CHANGE')) {
        // 4
        type = 'TRANSFER';
        subtype = await this.getActivitySubTypeId('TRANSFER', type);
        comment = 'MANDATORY - NAME CHANGE';
      } else if (description.includes('MARGIN INTEREST ADJUSTMENT')) {
        // 5
        type = 'FEES';
        subtype = await this.getActivitySubTypeId('Margin Expense', type);
        comment = 'MARGIN INTEREST ADJUSTMENT';
      } else if (description.includes('CASH IN LIEU OF FRACTIONAL SHARES')) {
        // 6
        type = 'SELL';
        subtype = await this.getActivitySubTypeId('Sell', type);
        comment = description;
      } else if (description.includes('OTHER INCOME')) {
        // 7
        type = 'DIVIDEND';
        subtype = await this.getActivitySubTypeId('Interest', type);
        comment = description;
      } else if (description.includes('FOREIGN SECURITY FEE')) {
        // 8
        type = 'FEES';
        subtype = await this.getActivitySubTypeId('Foreign Security Fee', type);
        comment = description;
      } else if (description.includes('ADR FEE')) {
        // 9
        type = 'FEES';
        subtype = await this.getActivitySubTypeId('ADR Fees', type);
        comment = description;
      } else if (
        description.includes('NON-TAXABLE SPIN OFF/LIQUIDATION DISTRIBUTION')
      ) {
        // 10
        type = 'TRANSFER';
        subtype = await this.getActivitySubTypeId('Spin off', type);
        comment = description;
      } else if (description.includes('LONG TERM GAIN DISTRIBUTION')) {
        // 11
        type = 'CASH';
        subtype = await this.getActivitySubTypeId(
          'Long-term Capital Gains',
          type
        );
        comment = description;
      } else if (description.includes('SHORT TERM CAPITAL GAINS')) {
        // 12
        type = 'CASH';
        subtype = await this.getActivitySubTypeId(
          'Short Term Capital Gains',
          type
        );
        comment = description;
      } else if (description && description.includes('QUALIFIED DIVIDEND')) {
        // 13
        type = 'DIVIDEND';
        subtype = await this.getActivitySubTypeId('Qualified Dividend', type);
        comment = description;
      } else if (description && description.includes('ORDINARY DIVIDEND')) {
        // 13
        type = 'DIVIDEND';
        subtype = await this.getActivitySubTypeId('Ordinary Dividend', type);
        comment = description;
      } else if (description && description.includes('FOREIGN TAX WITHHELD')) {
        // 14
        type = 'TAX';
        subtype = await this.getActivitySubTypeId('Foreign Tax Withheld', type);
      } else if (
        description &&
        description.includes('MANDATORY REVERSE SPLIT') &&
        !symbol
      ) {
        // 15
        continue;
      } else if (
        description &&
        description.includes('MANDATORY REVERSE SPLIT')
      ) {
        // 15
        type = 'TRANSFER';
        subtype = await this.getActivitySubTypeId('Reverse Split', type);
      } else if (
        description &&
        description.includes('INTEREST INCOME - SECURITIES')
      ) {
        // 16
        type = 'DIVIDEND';
        subtype = await this.getActivitySubTypeId('Interest', type);
      } else if (
        description &&
        description.includes('PARTNERSHIP DISTRIBUTION')
      ) {
        // 17
        type = 'DIVIDEND';
        subtype = await this.getActivitySubTypeId(
          'Partnership Distribution',
          type
        );
      } else if (description && description.includes('STOCK SPLIT')) {
        // 18
        type = 'TRANSFER';
        subtype = await this.getActivitySubTypeId('Split', type);
      }

      if (description && description.includes('Sold') && description.includes('Put')) {
        type = 'SELL'
        subtype = await this.getActivitySubTypeId('Sell Put')
      } else if (description && description.includes('Bought') && description.includes('Call')) {
        type = 'BUY'
        subtype = await this.getActivitySubTypeId('Buy Call')
      } else if (description && description.includes('Sold') && description.includes('Call')) {
        type = 'SELL'
        subtype = await this.getActivitySubTypeId('Sell Call')
      } else if (description && description.includes('Bought') && description.includes('Put')) {
        type = 'BUY'
        subtype = await this.getActivitySubTypeId('Buy Put')
      }

      comment = description;
      let fee = 0;
      if (order['REG FEE']) {
        fee += order['REG FEE'];
      }
      if (order['SHORT-TERM RDM FEE']) {
        fee += order['SHORT-TERM RDM FEE'];
      }
      if (order['FUND REDEMPTION FEE']) {
        fee += order['FUND REDEMPTION FEE'];
      }

      if (order['COMMISSION']) {
        fee += order['COMMISSION'];
      }

      const date = parseISO(order['DATE']);

      if (!symbol) {
        type = 'CASH';
        if (description.includes('OFF-CYCLE INTEREST (MMDA')) {
          subtype = await this.getActivitySubTypeId('Interest');
        } else if (description.includes('FREE BALANCE INTEREST ADJUSTMENT')) {
          type = 'CASH';
          subtype = await this.getActivitySubTypeId('Interest', type);
          comment = description;
        } else {
          subtype = await this.getActivitySubTypeId('Deposit');
        }
        comment = description;
        const id = uuidv4();

        await this.prismaService.order.create({
          data: {
            date: date,
            fee,
            quantity: order['QUANTITY'] ? order['QUANTITY'] : 1,
            type,
            subtype,
            unitPrice: order['PRICE'] ? order['PRICE'] : order['AMOUNT'],
            transactionId: order['TRANSACTION ID'],
            comment,
            User: {
              connect: {
                id: userId
              }
            },
            SymbolProfile: {
              create: {
                currency: 'USD',
                dataSource: 'MANUAL',
                symbol: id
              }
            },
            Account: {
              connect: {
                id_userId: {
                  id: accountId,
                  userId: userId
                }
              }
            }
          }
        });
        continue;
      }

      // const dividendpershare_at_cost = await this.getDividendpershareAtCost(symbol, new Date(order['DATE']), response);
      const dividendpershare_at_cost = 0; // will set in the background.
      const obj = {
        date: date,
        fee,
        quantity: order['QUANTITY'] ? order['QUANTITY'] : 1,
        type,
        unitPrice: order['PRICE'] ? order['PRICE'] : order['AMOUNT'],
        dividendpershare_at_cost,
        subtype,
        comment,
        transactionId: order['TRANSACTION ID']
      };

      if (symbol) {
        try {
          await this.prismaService.order.create({
            data: {
              ...obj,
              dividendpershare_at_costFlag: false,
              Account: {
                connect: {
                  id_userId: {
                    id: accountId,
                    userId: userId
                  }
                }
              },
              User: {
                connect: {
                  id: userId
                }
              },
              SymbolProfile: {
                connect: {
                  id: symbolProfileId
                }
              }
            }
          });
        } catch (error) {
          console.log(error);
        }
      }
    } // End of for loop

    await this.updateCSVOrder(
      csv_data,
      fileName,
      userId,
      accountId,
      institutionId
    );

    console.log('DONE FOR -----> ', symbol);
  }

  public async getDividendpershareAtCost(symbol, actionDate, response) {
    if (!symbol) return 0.0;
    // let response = await this.dataGatheringService.getHistoricalDividendData(symbol);
    let dividendpershare_at_cost = 0.0;
    let lastPeriod = null;
    if (response && response.length >= 1) {
      lastPeriod = response[response.length - 1]['period']
        ? response[response.length - 1]['period']
        : { period: '' };
    }

    // Logic for dividendpershare_at_cost
    if (!response) {
      // If HistoricalDividendData is null or undefined then dividendpershare_at_cost is null.
      dividendpershare_at_cost = null;
    } else if (lastPeriod === 'Quarterly' && response.length < 4) {
      dividendpershare_at_cost = response[response.length - 1]['value'] * 4;
    } else if (lastPeriod === 'SemiAnnual' && response.length < 2) {
      dividendpershare_at_cost = response[response.length - 1]['value'] * 2;
    } else if (lastPeriod === 'Monthly' && response.length < 12) {
      dividendpershare_at_cost = response[response.length - 1]['value'] * 12;
    } else if (response && response.length > 1) {
      // frontendDate = A date which is Stock Buy, Sell or Dividend .
      // Add Activity form contains this frontendDate.
      const frontendDate = format(new Date(actionDate), 'yyyy-MM-dd');
      // Getting HistoricalDividendData only lesser than or equal to frontendDate.
      response = response.filter((value) => value['date'] <= frontendDate);
      // Getting period of last record or dividend release after frontendDate filteration.
      const { period } = response[response.length - 1]
        ? response[response.length - 1]
        : { period: '' };
      let sum = 0;
      // Calculation logic for dividendpershare_at_cost field.
      if (period === 'Quarterly') {
        response
          .slice(response.length - 4, response.length)
          .map((e) => (sum += e['value']));
      } else if (period === 'Annual') {
        response
          .slice(response.length - 1, response.length)
          .map((e) => (sum += e['value']));
      } else if (period === 'SemiAnnual') {
        response
          .slice(response.length - 2, response.length)
          .map((e) => (sum += e['value']));
      } else {
        // TFLO Symbol comes in this block
        response
          .slice(response.length - 1, response.length)
          .map((e) => (sum += e['value']));
      }

      // Setting sum variable to dividendpershare_at_cost field of order table.
      dividendpershare_at_cost = sum;
    }

    return dividendpershare_at_cost;
  }

  public async postCSVFileUpload(bodyData, userId) {
    try {
      const { institutionId, accountId, csv_data, fileName } = bodyData;

      for (const [key, value] of Object.entries(csv_data)) {
        const job = {
          csv_data: value,
          symbol: key,
          accountId,
          institutionId,
          userId,
          fileName
        };

        const data: {
          institutionId: string;
          symbol: string;
          accountId: string;
          csv_data: any;
          userId;
          fileName: string;
        } = job;

        await this.uploadCSV(data);
      }
    } catch (error) {
      console.log(error);
    }

    return 1;
  }

  public async updateDividendPershareAtCost(): Promise<void> {
    let orders = await this.prismaService.order.findMany({
      where: {
        dividendpershare_at_costFlag: false
      },
      include: {
        SymbolProfile: {
          select: {
            symbol: true
          }
        }
      }
    });

    if (orders && orders.length === 0) {
      Logger.log('dividendpershare_at_cost column is Already Synced!');
      return;
    }

    orders = orders.map((e) => {
      return { ...e, symbol: e['SymbolProfile']['symbol'] };
    });

    const ordersWithGroup = groupBy(orders, 'symbol');

    for (const symbol in ordersWithGroup) {
      if (Object.prototype.hasOwnProperty.call(ordersWithGroup, symbol)) {
        const ordersArray = ordersWithGroup[symbol];
        const response =
          await this.dataGatheringService.getHistoricalDividendData(symbol);

        for (const order of ordersArray) {
          const dividendpershare_at_cost = await this.getDividendpershareAtCost(
            symbol,
            order.date,
            response
          );

          await this.prismaService.order.update({
            where: {
              id: order.id
            },
            data: {
              dividendpershare_at_cost,
              dividendpershare_at_costFlag: true
            }
          });
        }
        Logger.log('dividendpershare_at_cost column is Synced for ' + symbol);
      }
    }
  }
}
