import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SyncBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsOptional()
  bookingRef?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  companionId?: string;

  @IsString()
  @IsOptional()
  companionName?: string;

  @IsString()
  @IsOptional()
  companionPhone?: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsString()
  @IsOptional()
  activityName?: string;

  @IsString()
  @IsOptional()
  venueName?: string;

  @IsString()
  @IsOptional()
  venueAddress?: string;

  @IsString()
  @IsOptional()
  venueArea?: string;

  @IsString()
  @IsOptional()
  venueCity?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  durationMins?: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsNumber()
  @IsOptional()
  bookingAmount?: number;

  @IsNumber()
  @IsOptional()
  platformFeeAmount?: number;

  @IsNumber()
  @IsOptional()
  companionNetAmount?: number;

  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @IsString()
  @IsOptional()
  cancelReason?: string;
}
