import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { UserStatus, UserVerificationStatus } from '@prisma/client';

export class CustomerQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(Object.values(UserStatus)) status?: UserStatus;
  @IsOptional()
  @IsIn(Object.values(UserVerificationStatus))
  verificationStatus?: UserVerificationStatus;
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @IsString() search?: string;
}
