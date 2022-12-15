import { Account as AccountModel, Institution, Platform } from '@prisma/client';

export type AccountWithValue = AccountModel & {
  balanceInBaseCurrency: number;
  Platform?: Platform;
  Institution?: Institution;
  transactionCount: number;
  value: number;
  valueInBaseCurrency: number;
};
