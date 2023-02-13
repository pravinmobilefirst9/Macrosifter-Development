const {
  AccountType,
  DataSource,
  PrismaClient,
  Role,
  Type
} = require('@prisma/client');
const prisma = new PrismaClient();

// fehzan@macrosifter.com (Sandbox - 1 free sample account, Development 100/100 items).
// The password is G%6#!q2S@s2K.

async function main() {
  const platformBitcoinSuisse = await prisma.platform.upsert({
    create: {
      id: '70b6e475-a2b9-4527-99db-943e4f38ce45',
      name: 'Bitcoin Suisse',
      url: 'https://www.bitcoinsuisse.com'
    },
    update: {},
    where: { id: '70b6e475-a2b9-4527-99db-943e4f38ce45' }
  });

  const platformBitpanda = await prisma.platform.upsert({
    create: {
      id: 'debf9110-498f-4811-b972-7ebbd317e730',
      name: 'Bitpanda',
      url: 'https://www.bitpanda.com'
    },
    update: {},
    where: { id: 'debf9110-498f-4811-b972-7ebbd317e730' }
  });

  const platformCoinbase = await prisma.platform.upsert({
    create: {
      id: '8dc24b88-bb92-4152-af25-fe6a31643e26',
      name: 'Coinbase',
      url: 'https://www.coinbase.com'
    },
    update: {},
    where: { id: '8dc24b88-bb92-4152-af25-fe6a31643e26' }
  });

  const platformDegiro = await prisma.platform.upsert({
    create: {
      id: '94c1a2f4-a666-47be-84cd-4c8952e74c81',
      name: 'DEGIRO',
      url: 'https://www.degiro.eu'
    },
    update: {},
    where: { id: '94c1a2f4-a666-47be-84cd-4c8952e74c81' }
  });

  const platformInteractiveBrokers = await prisma.platform.upsert({
    create: {
      id: '9da3a8a7-4795-43e3-a6db-ccb914189737',
      name: 'Interactive Brokers',
      url: 'https://www.interactivebrokers.com'
    },
    update: {},
    where: { id: '9da3a8a7-4795-43e3-a6db-ccb914189737' }
  });

  const platformPostFinance = await prisma.platform.upsert({
    create: {
      id: '5377d9df-0d25-42c2-9d9b-e4c63166281e',
      name: 'PostFinance',
      url: 'https://www.postfinance.ch'
    },
    update: {},
    where: { id: '5377d9df-0d25-42c2-9d9b-e4c63166281e' }
  });

  const platformSwissquote = await prisma.platform.upsert({
    create: {
      id: '1377d9df-0d25-42c2-9d9b-e4c63156291f',
      name: 'Swissquote',
      url: 'https://swissquote.com'
    },
    update: {},
    where: { id: '1377d9df-0d25-42c2-9d9b-e4c63156291f' }
  });

  const userDemo = await prisma.user.upsert({
    create: {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjliMTEyYjRkLTNiN2QtNGJhZC05YmRkLTNiMGY3YjRkYWMyZiIsImlhdCI6MTYxODUxMjAxNCwiZXhwIjoxNjIxMTA0MDE0fQ.l3WUxpI0hxuQtdPrD0kd7sem6S2kx_7CrdNvkmlKuWw',
      Account: {
        create: [
          {
            accountType: AccountType.SECURITIES,
            balance: 0,
            currency: 'USD',
            id: 'd804de69-0429-42dc-b6ca-b308fd7dd926',
            name: 'Coinbase Account',
            platformId: platformCoinbase.id
          },
          {
            accountType: AccountType.SECURITIES,
            balance: 0,
            currency: 'EUR',
            id: '65cfb79d-b6c7-4591-9d46-73426bc62094',
            name: 'DEGIRO Account',
            platformId: platformDegiro.id
          },
          {
            accountType: AccountType.SECURITIES,
            balance: 0,
            currency: 'USD',
            id: '480269ce-e12a-4fd1-ac88-c4b0ff3f899c',
            isDefault: true,
            name: 'Interactive Brokers Account',
            platformId: platformInteractiveBrokers.id
          }
        ]
      },
      id: '9b112b4d-3b7d-4bad-9bdd-3b0f7b4dac2f',
      role: Role.DEMO
    },
    update: {},
    where: { id: '9b112b4d-3b7d-4bad-9bdd-3b0f7b4dac2f' }
  });

  await prisma.symbolProfile.createMany({
    data: [
      {
        assetClass: 'EQUITY',
        assetSubClass: 'STOCK',
        countries: [{ code: 'US', weight: 1 }],
        currency: 'USD',
        dataSource: DataSource.YAHOO,
        id: '2bd26362-136e-411c-b578-334084b4cdcc',
        name: 'Amazon.com Inc.',
        sectors: [{ name: 'Consumer Cyclical', weight: 1 }],
        symbol: 'AMZN'
      },
      {
        assetClass: 'CASH',
        assetSubClass: 'CRYPTOCURRENCY',
        countries: undefined,
        currency: 'USD',
        dataSource: DataSource.YAHOO,
        id: 'fdc42ea6-1321-44f5-9fb0-d7f1f2cf9b1e',
        name: 'Bitcoin USD',
        sectors: undefined,
        symbol: 'BTCUSD'
      },
      {
        assetClass: 'EQUITY',
        assetSubClass: 'STOCK',
        countries: [{ code: 'US', weight: 1 }],
        currency: 'USD',
        dataSource: DataSource.YAHOO,
        id: 'd1ee9681-fb21-4f99-a3b7-afd4fc04df2e',
        name: 'Tesla Inc.',
        sectors: [{ name: 'Consumer Cyclical', weight: 1 }],
        symbol: 'TSLA'
      },
      {
        assetClass: 'EQUITY',
        assetSubClass: 'ETF',
        countries: [
          { code: 'US', weight: 0.9886789999999981 },
          { code: 'NL', weight: 0.000203 },
          { code: 'CA', weight: 0.000362 }
        ],
        currency: 'USD',
        dataSource: DataSource.YAHOO,
        id: '7d9c8540-061e-4e7e-b019-0d0f4a84e796',
        name: 'Vanguard Total Stock Market Index Fund ETF',
        sectors: [
          { name: 'Technology', weight: 0.31393799999999955 },
          { name: 'Consumer Cyclical', weight: 0.149224 },
          { name: 'Financials', weight: 0.11716100000000002 },
          { name: 'Healthcare', weight: 0.13285199999999994 },
          { name: 'Consumer Staples', weight: 0.053919000000000016 },
          { name: 'Energy', weight: 0.025529999999999997 },
          { name: 'Telecommunications', weight: 0.012579 },
          { name: 'Industrials', weight: 0.09526399999999995 },
          { name: 'Utilities', weight: 0.024791999999999988 },
          { name: 'Materials', weight: 0.027664 },
          { name: 'Real Estate', weight: 0.03239999999999998 },
          { name: 'Communication', weight: 0.0036139999999999996 },
          { name: 'Other', weight: 0.000218 }
        ],
        symbol: 'VTI'
      }
    ],
    skipDuplicates: true
  });

  await prisma.order.createMany({
    data: [
      {
        accountId: '65cfb79d-b6c7-4591-9d46-73426bc62094',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2017, 0, 3, 0, 0, 0)),
        fee: 30,
        id: 'cf7c0418-8535-4089-ae3d-5dbfa0aec2e1',
        quantity: 50,
        symbolProfileId: 'd1ee9681-fb21-4f99-a3b7-afd4fc04df2e', // TSLA
        type: Type.BUY,
        unitPrice: 42.97,
        userId: userDemo.id
      },
      {
        accountId: 'd804de69-0429-42dc-b6ca-b308fd7dd926',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2017, 7, 16, 0, 0, 0)),
        fee: 29.9,
        id: 'a1c5d73a-8631-44e5-ac44-356827a5212c',
        quantity: 0.5614682,
        symbolProfileId: 'fdc42ea6-1321-44f5-9fb0-d7f1f2cf9b1e', // BTCUSD
        type: Type.BUY,
        unitPrice: 3562.089535970158,
        userId: userDemo.id
      },
      {
        accountId: '480269ce-e12a-4fd1-ac88-c4b0ff3f899c',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2018, 9, 1, 0, 0, 0)),
        fee: 80.79,
        id: '71c08e2a-4a86-44ae-a890-c337de5d5f9b',
        quantity: 5,
        symbolProfileId: '2bd26362-136e-411c-b578-334084b4cdcc', // AMZN
        type: Type.BUY,
        unitPrice: 2021.99,
        userId: userDemo.id
      },
      {
        accountId: '480269ce-e12a-4fd1-ac88-c4b0ff3f899c',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2019, 2, 1, 0, 0, 0)),
        fee: 19.9,
        id: '385f2c2c-d53e-4937-b0e5-e92ef6020d4e',
        quantity: 10,
        symbolProfileId: '7d9c8540-061e-4e7e-b019-0d0f4a84e796', // VTI
        type: Type.BUY,
        unitPrice: 144.38,
        userId: userDemo.id
      },
      {
        accountId: '480269ce-e12a-4fd1-ac88-c4b0ff3f899c',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2019, 8, 3, 0, 0, 0)),
        fee: 19.9,
        id: '185f2c2c-d53e-4937-b0e5-a93ef6020d4e',
        quantity: 10,
        symbolProfileId: '7d9c8540-061e-4e7e-b019-0d0f4a84e796', // VTI
        type: Type.BUY,
        unitPrice: 147.99,
        userId: userDemo.id
      },
      {
        accountId: '480269ce-e12a-4fd1-ac88-c4b0ff3f899c',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2020, 2, 2, 0, 0, 0)),
        fee: 19.9,
        id: '347b0430-a84f-4031-a0f9-390399066ad6',
        quantity: 10,
        symbolProfileId: '7d9c8540-061e-4e7e-b019-0d0f4a84e796', // VTI
        type: Type.BUY,
        unitPrice: 151.41,
        userId: userDemo.id
      },
      {
        accountId: '480269ce-e12a-4fd1-ac88-c4b0ff3f899c',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2020, 8, 1, 0, 0, 0)),
        fee: 19.9,
        id: '67ec3f47-3189-4b63-ba05-60d3a06b302f',
        quantity: 10,
        symbolProfileId: '7d9c8540-061e-4e7e-b019-0d0f4a84e796', // VTI
        type: Type.BUY,
        unitPrice: 177.69,
        userId: userDemo.id
      },
      {
        accountId: '480269ce-e12a-4fd1-ac88-c4b0ff3f899c',
        accountUserId: userDemo.id,
        date: new Date(Date.UTC(2020, 2, 1, 0, 0, 0)),
        fee: 19.9,
        id: 'd01c6fbc-fa8d-47e6-8e80-66f882d2bfd2',
        quantity: 10,
        symbolProfileId: '7d9c8540-061e-4e7e-b019-0d0f4a84e796', // VTI
        type: Type.BUY,
        unitPrice: 203.15,
        userId: userDemo.id
      }
    ],
    skipDuplicates: true
  });

  await prisma.activityType.createMany({
    data: [
      {
        id: 1,
        type: 'BUY'
      },
      {
        id: 2,
        type: 'DIVIDEND'
      },
      {
        id: 3,
        type: 'ITEM'
      },
      {
        id: 4,
        type: 'SELL'
      },
      {
        id: 5,
        type: 'TAX'
      },
      {
        id: 6,
        type: 'FEES'
      },
      {
        id: 7,
        type: 'CANCEL'
      },
      {
        id: 8,
        type: 'TRANSFER'
      },
      {
        id: 9,
        type: 'CASH'
      }
    ],
    skipDuplicates: true
  });

  const activitySubType = await prisma.activitySubType.createMany({
    data: [
      { type: 'BUY', subtype: 'Assignment', typeId: 1, id: 1 },
      { type: 'BUY', subtype: 'Buy to Cover', typeId: 1, id: 2 },
      {
        type: 'BUY',
        subtype: 'Ordinary Dividend Reinvestment',
        typeId: 1,
        id: 3
      },
      {
        type: 'BUY',
        subtype: 'Qualified Dividend Reinvestment',
        typeId: 1,
        id: 4
      },
      { type: 'BUY', subtype: 'Interest Reinvestment', typeId: 1, id: 5 },
      {
        type: 'BUY',
        subtype: 'Partnership Distribution Reinvestment',
        typeId: 1,
        id: 6
      },
      {
        type: 'BUY',
        subtype: 'Long Term Capital Gain Reinvestment',
        typeId: 1,
        id: 7
      },
      {
        type: 'BUY',
        subtype: 'Short Term Capital Gain Reinvestment',
        typeId: 1,
        id: 8
      },
      { type: 'BUY', subtype: 'Buy', typeId: 1, id: 9 },
      { type: 'BUY', subtype: 'Contribution', typeId: 1, id: 10 },
      { type: 'SELL', subtype: 'Exercise', typeId: 4, id: 11 },
      { type: 'SELL', subtype: 'Sell short', typeId: 4, id: 12 },
      { type: 'SELL', subtype: 'Sell', typeId: 4, id: 13 },
      { type: 'SELL', subtype: 'Distribution', typeId: 4, id: 14 },
      { type: 'DIVIDEND', subtype: 'Ordinary Dividend', typeId: 2, id: 15 },
      {
        type: 'DIVIDEND',
        subtype: 'Qualified Dividend',
        typeId: 2,
        id: 16
      },
      { type: 'DIVIDEND', subtype: 'Interest', typeId: 2, id: 17 },
      {
        type: 'DIVIDEND',
        subtype: 'Partnership Distribution',
        typeId: 2,
        id: 18
      },
      { type: 'TAX', subtype: 'Foreign Tax Withheld', typeId: 5, id: 19 },
      { type: 'TAX', subtype: 'Tax Withheld', typeId: 5, id: 20 },
      { type: 'TAX', subtype: 'Non-Resident Tax', typeId: 5, id: 21 },
      { type: 'FEES', subtype: 'Account Fee', typeId: 6, id: 22 },
      { type: 'FEES', subtype: 'Management Fee', typeId: 6, id: 23 },
      { type: 'FEES', subtype: 'Transfer Fee', typeId: 6, id: 24 },
      { type: 'FEES', subtype: 'Trust Fee', typeId: 6, id: 25 },
      { type: 'FEES', subtype: 'ADR Fees', typeId: 6, id: 26 },
      { type: 'FEES', subtype: 'Foreign Security Fee', typeId: 6, id: 27 },
      { type: 'FEES', subtype: 'Other Fees', typeId: 6, id: 28 },
      { type: 'FEES', subtype: 'Legal Fee', typeId: 6, id: 29 },
      { type: 'FEES', subtype: 'Margin Expense', typeId: 6, id: 30 },
      { type: 'FEES', subtype: 'Adjustment', typeId: 6, id: 31 },
      { type: 'TRANSFER', subtype: 'Assignment', typeId: 8, id: 32 },
      { type: 'TRANSFER', subtype: 'Adjustment', typeId: 8, id: 33 },
      { type: 'TRANSFER', subtype: 'Exercise', typeId: 8, id: 34 },
      { type: 'TRANSFER', subtype: 'Expire', typeId: 8, id: 35 },
      { type: 'TRANSFER', subtype: 'Merger', typeId: 8, id: 36 },
      { type: 'TRANSFER', subtype: 'Request', typeId: 8, id: 37 },
      { type: 'TRANSFER', subtype: 'Send', typeId: 8, id: 38 },
      { type: 'TRANSFER', subtype: 'Spin off', typeId: 8, id: 39 },
      { type: 'TRANSFER', subtype: 'Split', typeId: 8, id: 40 },
      { type: 'TRANSFER', subtype: 'Trade', typeId: 8, id: 41 },
      { type: 'TRANSFER', subtype: 'Transfer', typeId: 8, id: 42 },
      { type: 'CASH', subtype: 'Contribution', typeId: 9, id: 43 },
      { type: 'CASH', subtype: 'Deposit', typeId: 9, id: 44 },
      { type: 'CASH', subtype: 'Distribution', typeId: 9, id: 45 },
      { type: 'CASH', subtype: 'Margin expense', typeId: 9, id: 46 },
      {
        type: 'CASH',
        subtype: 'Long-term Capital Gains',
        typeId: 9,
        id: 47
      },
      {
        type: 'CASH',
        subtype: 'Short Term Capital Gains',
        typeId: 9,
        id: 48
      },
      { type: 'CASH', subtype: 'Pending Credit', typeId: 9, id: 49 },
      { type: 'CASH', subtype: 'Pending Debit', typeId: 9, id: 50 },
      { type: 'CASH', subtype: 'Unqualified Gain', typeId: 9, id: 51 },
      { type: 'CASH', subtype: 'Withdrawal', typeId: 9, id: 52 },
      { type: 'CASH', subtype: 'Interest', typeId: 9, id: 53 },
      { type: 'TRANSFER', subtype: 'Reverse Split', typeId: 8, id: 54 }
    ],
    skipDuplicates: true
  });

  await prisma.accountTypes.createMany({
    data: [
      {
        id: 1,
        accountTypeName: 'CASH',
        show: true
      },
      {
        id: 2,
        accountTypeName: 'SECURITIES',
        show: true
      },
      {
        id: 3,
        accountTypeName: 'LOAN',
        show: true
      },
      {
        id: 4,
        accountTypeName: 'CREDIT',
        show: true
      },
      {
        id: 5,
        accountTypeName: 'OTHER',
        show: true
      },
      {
        id: 6,
        accountTypeName: 'HOLDING_COMPANY',
        show: true
      }
    ],
    skipDuplicates: true
  });

  await prisma.accountSubTypes.createMany({
    data: [
      {
        id: 1,
        accountSubTypeName: 'Checking Account',
        plaidAccountSubtype: 'checking',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: null
      },
      {
        id: 2,
        accountSubTypeName: 'Savings Account',
        plaidAccountSubtype: 'savings',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: null
      },
      {
        id: 3,
        accountSubTypeName: 'Health Saving Account (HSA)',
        plaidAccountSubtype: 'hsa',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: 'US'
      },
      {
        id: 4,
        accountSubTypeName: 'Certificate of Deposit Account (CD)',
        plaidAccountSubtype: 'cd',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: null
      },
      {
        id: 5,
        accountSubTypeName: 'Money Market Account',
        plaidAccountSubtype: 'money market',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: null
      },
      {
        id: 6,
        accountSubTypeName: 'Paypal',
        plaidAccountSubtype: 'paypal',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: null
      },
      {
        id: 7,
        accountSubTypeName: 'Prepaid debit card',
        plaidAccountSubtype: 'prepaid',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: null
      },
      {
        id: 8,
        accountSubTypeName: 'Cash Management Account',
        plaidAccountSubtype: 'cash management',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: null
      },
      {
        id: 9,
        accountSubTypeName: 'Electronic Benefit Transfer (EBT)',
        plaidAccountSubtype: 'ebt',
        plaidAccountType: 'depository',
        accountTypeId: 1,
        country: 'US'
      },
      {
        id: 10,
        accountSubTypeName: '529 Plan',
        plaidAccountSubtype: '529',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 11,
        accountSubTypeName: '401(a) Retirement Plan',
        plaidAccountSubtype: '401a',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 12,
        accountSubTypeName: '401(k) Retirement Account',
        plaidAccountSubtype: '401k',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 13,
        accountSubTypeName: '403(b) Savings Account',
        plaidAccountSubtype: '403B',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 14,
        accountSubTypeName: '457(b0 Retirement Plan',
        plaidAccountSubtype: '457b',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 15,
        accountSubTypeName: 'Brokerage Account',
        plaidAccountSubtype: 'brokerage',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 16,
        accountSubTypeName: 'Individual Savings Account (ISA)',
        plaidAccountSubtype: 'cash isa',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'UK'
      },
      {
        id: 17,
        accountSubTypeName: 'Crypto Exchange',
        plaidAccountSubtype: 'crypto exchange',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 18,
        accountSubTypeName: 'Education Savings Account (ESA)',
        plaidAccountSubtype: 'education savings account',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 19,
        accountSubTypeName: 'Fixed Annuity',
        plaidAccountSubtype: 'fixed annuity',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 20,
        accountSubTypeName: 'Guaranteed Investment Certificate',
        plaidAccountSubtype: 'gic',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 21,
        accountSubTypeName: 'Tax-Adv. Health Reimbursement Arranagement (HRA)',
        plaidAccountSubtype: 'health reimbursement arrangement',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 22,
        accountSubTypeName: 'Non-Cash Health Savings Account (HSA)',
        plaidAccountSubtype: 'hsa',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 23,
        accountSubTypeName: 'Traditional Individual Retirement Account (IRA)',
        plaidAccountSubtype: 'ira',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 24,
        accountSubTypeName: 'Non-cash Individual Savings Account (ISA)',
        plaidAccountSubtype: 'isa',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'UK'
      },
      {
        id: 25,
        accountSubTypeName: 'Keogh',
        plaidAccountSubtype: 'keogh',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 26,
        accountSubTypeName: 'Life Income Fund (LIF) Retirement Account',
        plaidAccountSubtype: 'lif',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 27,
        accountSubTypeName: 'Life Insurance Account',
        plaidAccountSubtype: 'life insurance',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 28,
        accountSubTypeName: 'Locked-in Retirement Account (LIRA)',
        plaidAccountSubtype: 'lira',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 29,
        accountSubTypeName: 'Locked-in Retirement Income Fund (LRIF)',
        plaidAccountSubtype: 'lrif',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 30,
        accountSubTypeName: 'Mutual Fund Account',
        plaidAccountSubtype: 'mutual fund',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 31,
        accountSubTypeName: 'Non-custodial Account',
        plaidAccountSubtype: 'non-custodial wallet',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 32,
        accountSubTypeName: 'Other',
        plaidAccountSubtype: 'other',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 33,
        accountSubTypeName: 'Other Annuity',
        plaidAccountSubtype: 'other annuity',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 34,
        accountSubTypeName: 'Other Insurance',
        plaidAccountSubtype: 'other insurance',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 35,
        accountSubTypeName: 'Pension',
        plaidAccountSubtype: 'pension',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 36,
        accountSubTypeName: 'Prescribed Registered Retirement Income Fund',
        plaidAccountSubtype: 'prif',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 37,
        accountSubTypeName: 'Profit Sharing Plan',
        plaidAccountSubtype: 'profit sharing plan',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 38,
        accountSubTypeName: 'Qualifying share account',
        plaidAccountSubtype: 'qshr',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 39,
        accountSubTypeName: 'Registered Disability Savings Plan (RSDP)',
        plaidAccountSubtype: 'rdsp',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 40,
        accountSubTypeName: 'Registered Education Savings Plan (RESP)',
        plaidAccountSubtype: 'resp',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 41,
        accountSubTypeName: 'Other Retirement',
        plaidAccountSubtype: 'retirement',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 42,
        accountSubTypeName: 'Restricted Life Income Fund (RLIF)',
        plaidAccountSubtype: 'rlif',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 43,
        accountSubTypeName: 'Roth IRA',
        plaidAccountSubtype: 'roth',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 44,
        accountSubTypeName: 'Roth 401k',
        plaidAccountSubtype: 'roth 401k',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 45,
        accountSubTypeName: 'Registered Retirement Income Fund (RRIF)',
        plaidAccountSubtype: 'rrif',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 46,
        accountSubTypeName: 'SARSEP',
        plaidAccountSubtype: 'sarsep',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 47,
        accountSubTypeName: 'SEP IRA',
        plaidAccountSubtype: 'sep ira',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 48,
        accountSubTypeName: 'Simple IRA',
        plaidAccountSubtype: 'simple ira',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 49,
        accountSubTypeName: 'Self-Invested Personal Pension (SIPP)',
        plaidAccountSubtype: 'sipp',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'UK'
      },
      {
        id: 50,
        accountSubTypeName: 'Standard Stock Plan Account',
        plaidAccountSubtype: 'stock plan',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 51,
        accountSubTypeName: 'Tax-Free Savings Account (TFSA)',
        plaidAccountSubtype: 'tfsa',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'CA'
      },
      {
        id: 52,
        accountSubTypeName: 'Trust',
        plaidAccountSubtype: 'trust',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 53,
        accountSubTypeName: 'UGMA Brokerage Account',
        plaidAccountSubtype: 'ugma',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 54,
        accountSubTypeName: 'UTMA Brokerage Account',
        plaidAccountSubtype: 'utma',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: 'US'
      },
      {
        id: 55,
        accountSubTypeName: 'Variable Annuity',
        plaidAccountSubtype: 'variable annuity',
        plaidAccountType: 'investment',
        accountTypeId: 2,
        country: null
      },
      {
        id: 56,
        accountSubTypeName: 'Credit Card',
        plaidAccountSubtype: 'credit card',
        plaidAccountType: 'credit',
        accountTypeId: 4,
        country: null
      },
      {
        id: 57,
        accountSubTypeName: 'Paypal Credit Card',
        plaidAccountSubtype: 'paypal',
        plaidAccountType: 'credit',
        accountTypeId: 4,
        country: null
      },
      {
        id: 58,
        accountSubTypeName: 'Car Loan',
        plaidAccountSubtype: 'auto',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 59,
        accountSubTypeName: 'Business Loan',
        plaidAccountSubtype: 'business',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 60,
        accountSubTypeName: 'Commercial Loan',
        plaidAccountSubtype: 'commercial',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 61,
        accountSubTypeName: 'Consumer Facing Loan',
        plaidAccountSubtype: 'consumer',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 62,
        accountSubTypeName: 'Home Equity Line of LOAN (HELOC)',
        plaidAccountSubtype: 'home equity',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 63,
        accountSubTypeName: 'General Loan',
        plaidAccountSubtype: 'loan',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 64,
        accountSubTypeName: 'Mortgage Loan',
        plaidAccountSubtype: 'mortgage',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 65,
        accountSubTypeName: 'Overdraft Account',
        plaidAccountSubtype: 'overdraft',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 66,
        accountSubTypeName: 'Line of LOAN',
        plaidAccountSubtype: 'line of credit',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 67,
        accountSubTypeName: 'Student Loan',
        plaidAccountSubtype: 'student',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      },
      {
        id: 68,
        accountSubTypeName: 'Other Loan',
        plaidAccountSubtype: 'other',
        plaidAccountType: 'loan',
        accountTypeId: 3,
        country: null
      }
    ],
    skipDuplicates: true
  });

  console.log({
    platformBitcoinSuisse,
    platformBitpanda,
    platformCoinbase,
    platformDegiro,
    platformInteractiveBrokers,
    platformPostFinance,
    platformSwissquote,
    userDemo
  });
}

async function deleteTables() {
  await prisma.symbolProfile.deleteMany();
  await prisma.order.deleteMany();
  await prisma.orderCSV.deleteMany();
  await prisma.marketData.deleteMany();
}

// deleteTables();

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
