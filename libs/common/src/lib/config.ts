import { DataSource } from '@prisma/client';
import { JobOptions, JobStatus } from 'bull';
import ms from 'ms';

export const DEMO_USER_ID = '9b112b4d-3b7d-4bad-9bdd-3b0f7b4dac2f';

export const ghostfolioScraperApiSymbolPrefix = '_GF_';
export const ghostfolioCashSymbol = `${ghostfolioScraperApiSymbolPrefix}CASH`;
export const ghostfolioFearAndGreedIndexDataSource = DataSource.RAPID_API;
export const ghostfolioFearAndGreedIndexSymbol = `${ghostfolioScraperApiSymbolPrefix}FEAR_AND_GREED_INDEX`;

export const locale = 'en-US';

export const primaryColorHex = '#72D8ED';
export const primaryColorRgb = {
  r: 114,
  g: 216,
  b: 237
};

export const secondaryColorHex = '#2D4BAA';
export const secondaryColorRgb = {
  r: 45,
  g: 75,
  b: 170
};

export const warnColorHex = '#dc3545';
export const warnColorRgb = {
  r: 220,
  g: 53,
  b: 69
};

export const ASSET_SUB_CLASS_EMERGENCY_FUND = 'EMERGENCY_FUND';

export const DATA_GATHERING_QUEUE = 'DATA_GATHERING_QUEUE';
export const DATA_GATHERING_QUEUE_PRIORITY_LOW = Number.MAX_SAFE_INTEGER;
export const DATA_GATHERING_QUEUE_PRIORITY_HIGH = 1;

export const DEFAULT_DATE_FORMAT_MONTH_YEAR = 'MMM yyyy';
export const DEFAULT_LANGUAGE_CODE = 'en';

export const GATHER_ASSET_PROFILE_PROCESS = 'GATHER_ASSET_PROFILE';
export const GATHER_ASSET_PROFILE_PROCESS_OPTIONS: JobOptions = {
  attempts: 10,
  backoff: {
    // delay: ms('1 minute'),
    delay: 1000,
    type: 'exponential',
  },
  priority: DATA_GATHERING_QUEUE_PRIORITY_HIGH,
  removeOnComplete: {
    age: ms('2 weeks') / 1000
  }
};
export const GATHER_HISTORICAL_MARKET_DATA_PROCESS =
  'GATHER_HISTORICAL_MARKET_DATA';
export const GATHER_HISTORICAL_MARKET_DATA_PROCESS_OPTIONS: JobOptions = {
  attempts: 10,
  backoff: {
    // delay: ms('1 minute'),
    delay: 1000,
    type: 'exponential'
  },
  priority: DATA_GATHERING_QUEUE_PRIORITY_LOW,
  removeOnComplete: {
    age: ms('2 weeks') / 1000
  }
};



export const MAX_CHART_ITEMS = 365;

export const PROPERTY_BENCHMARKS = 'BENCHMARKS';
export const PROPERTY_COUPONS = 'COUPONS';
export const PROPERTY_CURRENCIES = 'CURRENCIES';
export const PROPERTY_IS_READ_ONLY_MODE = 'IS_READ_ONLY_MODE';
export const PROPERTY_SLACK_COMMUNITY_USERS = 'SLACK_COMMUNITY_USERS';
export const PROPERTY_STRIPE_CONFIG = 'STRIPE_CONFIG';
export const PROPERTY_SYSTEM_MESSAGE = 'SYSTEM_MESSAGE';

export const QUEUE_JOB_STATUS_LIST = <JobStatus[]>[
  'active',
  'completed',
  'delayed',
  'failed',
  'paused',
  'waiting'
];

export const UNKNOWN_KEY = 'UNKNOWN';

export const PRIVACY_POLICY_LINK = '/';

export const TERMS_OF_USE_LINK = '/';
