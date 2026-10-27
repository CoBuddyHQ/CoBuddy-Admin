import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class SyncReviewDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsOptional()
  byCustomerId?: string;

  @IsString()
  @IsOptional()
  toCompanionId?: string;

  @IsString()
  @IsOptional()
  byCompanionId?: string;

  @IsString()
  @IsOptional()
  toCustomerId?: string;

  @IsNumber()
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  text?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tagCodes?: string[];
}
