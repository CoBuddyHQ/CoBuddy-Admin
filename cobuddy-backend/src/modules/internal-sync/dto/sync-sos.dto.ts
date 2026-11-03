import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SyncSosAlertDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  alertRef?: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userType: 'CUSTOMER' | 'COMPANION';

  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  authoritiesContacted?: boolean;

  @IsString()
  @IsOptional()
  audioClipUrl?: string;
}
