import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SyncCompanionApplicationDto {
  @IsString()
  @IsNotEmpty()
  companionId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  portfolioUrls?: string[];

  @IsString()
  @IsOptional()
  cvUrl?: string;

  @IsString()
  @IsOptional()
  applicationStatus?: string;
}
