export  interface WorldtimeapiByIpResposeInterface {
  timezone: string;
  datetime: string;
  utc_offset: string;
  abbreviation?: string;
  client_ip?: string;
  day_of_week?: number;
  day_of_year?: number;
  dst?: boolean;
  dst_from?: string;
  dst_offset?: string;
  dst_until?: string;
  raw_offset?: number;
  unixtime?: number;
  utc_datetime?: string;
  week_number?: number;
}
