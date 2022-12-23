import { Account as AccountModel, Institution, PlaidToken, Platform } from '@prisma/client';

export type AccountWithValue = AccountModel & {
  balanceInBaseCurrency: number;
  Platform?: Platform;
  Institution?: Institution;
  PlaidToken?: PlaidToken;
  access_token?: string;
  transactionCount: number;
  value: number;
  valueInBaseCurrency: number;
};
