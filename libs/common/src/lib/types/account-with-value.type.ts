import { Account as AccountModel, Institution, Platform } from '@prisma/client';

export type AccountWithValue = AccountModel & {
  balanceInBaseCurrency: number;
  Platform?: Platform;
  Institution?: Institution;
  access_token?: string;
  transactionCount: number;
  value: number;
  valueInBaseCurrency: number;
};
