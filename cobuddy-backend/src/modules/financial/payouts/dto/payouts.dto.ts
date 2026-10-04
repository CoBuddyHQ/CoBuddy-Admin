import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsIn, IsDateString, Length } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class ListPayoutsDto extends PaginationQueryDto {
  @IsOptional() @IsString() companionId?: string;
  @IsOptional() @IsIn(['PENDING', 'ON_HOLD', 'PROCESSING', 'PAID', 'FAILED']) status?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class HoldPayoutDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 500)
  reason: string;
}

export class ProcessPayoutDto {
  @IsOptional() @IsString() @Length(1, 128) utrNumber?: string;
  @IsOptional() @IsString() @Length(1, 128) gatewayPayoutId?: string;
}

export class MarkPaidDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 128)
  utrNumber: string;
  @IsOptional() @IsString() @Length(1, 128) gatewayPayoutId?: string;
}

export class MarkFailedDto extends HoldPayoutDto {}
