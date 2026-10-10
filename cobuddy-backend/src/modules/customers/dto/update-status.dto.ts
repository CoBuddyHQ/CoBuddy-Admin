import { IsString, IsOptional, IsIn } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateCustomerStatusDto {
  @IsIn(Object.values(UserStatus)) status: UserStatus;
  @IsOptional() @IsString() reason?: string;
}
