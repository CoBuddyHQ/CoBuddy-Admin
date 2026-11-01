import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';

export class SyncUserReportDto {
  @IsString()
  @IsNotEmpty()
  reporterId: string;

  @IsString()
  @IsIn(['CUSTOMER', 'COMPANION'])
  @IsNotEmpty()
  reporterType?: string; // 'CUSTOMER' | 'COMPANION'

  @IsString()
  @IsNotEmpty()
  reportedUserId: string;

  @IsString()
  @IsIn(['COMPANION', 'CUSTOMER'])
  @IsNotEmpty()
  reportedUserType?: string; // 'COMPANION' | 'CUSTOMER'

  @IsString()
  @IsNotEmpty()
  categoryCode: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  evidenceUrls?: string[];

  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsString()
  @IsOptional()
  reportRef?: string;
}

