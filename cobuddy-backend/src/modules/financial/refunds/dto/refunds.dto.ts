import {
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  IsInt,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class ListRefundsDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED']) status?: string;
  @IsOptional() @IsString() bookingId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class BookingRefundTierDto {
  @IsString() id: string;
  @IsInt() @Min(0) noticeHoursMin: number;
  @IsOptional() @IsInt() @Min(0) noticeHoursMax: number | null;
  @IsNumber() @Min(0) @Max(100) refundPercent: number;
}

export class BookingSettingsDto {
  @IsInt() @Min(1) minBookingDurationMins: number;
  @IsInt() @Min(1) maxBookingDurationMins: number;
  @IsInt() @Min(0) cancellationGracePeriodMins: number;
  @IsInt() @Min(0) autoCancelUnacceptedMins: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingRefundTierDto)
  cancellationRefundTiers: BookingRefundTierDto[];
}

export class ApproveRefundDto {
  @IsOptional() @IsString() note?: string;
}

export class RejectRefundDto {
  @IsString() reason: string;
}
