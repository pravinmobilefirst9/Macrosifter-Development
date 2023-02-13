import {IsBoolean, IsNumber, IsOptional, IsString} from "class-validator";
import {Transform} from "class-transformer";

export class TimezonesDto {

  @IsString()
  timezone: string;

  @IsString()
  abbreviation: string;

  @IsString()
  utc_offset: string;

  @IsBoolean()
  dst = false;

  @IsString()
  @IsOptional()
  dst_from: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  dst_offset: number;

  @IsString()
  @IsOptional()
  dst_until: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  raw_offset: number;

}
