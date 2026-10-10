import { IsOptional, IsString, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { UserStatus, UserVerificationStatus } from '@prisma/client';

export class CompanionQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(Object.values(UserStatus)) status?: UserStatus;
  @IsOptional()
  @IsIn(Object.values(UserVerificationStatus))
  verificationStatus?: UserVerificationStatus;
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) minTrustScore?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minEarnings?: number;
  @IsOptional() @IsString() search?: string;
}
