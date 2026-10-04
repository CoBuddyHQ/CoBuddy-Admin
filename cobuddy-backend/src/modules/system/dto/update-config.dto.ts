import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional() @IsString() defaultCurrency?: string;
  @IsOptional() @IsString() defaultLanguage?: string;
  @IsOptional() @IsString() serviceHoursOpen?: string;
  @IsOptional() @IsString() serviceHoursClose?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) platformFeePercent?: number;
}
