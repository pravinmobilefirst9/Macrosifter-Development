export interface TimezoneInterface {
  timezone: string;
  abbreviation: string;
  utc_offset: string;
  dst: boolean;
  dst_from: string;
  dst_offset: number;
  dst_until: string;
  raw_offset: number;
  datetime?: string;
  unixtime?: number;
  utc_datetime?: string
  week_number?: number
}
