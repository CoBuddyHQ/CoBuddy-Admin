import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class ListFraudFlagsDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['OPEN', 'INVESTIGATING', 'DISMISSED', 'ACTION_TAKEN']) status?: string;
  @IsOptional() @IsIn(['CUSTOMER', 'COMPANION']) userType?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() userId?: string;
}

export class UpdateFraudFlagDto {
  @IsOptional() @IsIn(['OPEN', 'INVESTIGATING', 'DISMISSED', 'ACTION_TAKEN']) status?: string;
  @IsOptional() @IsString() assignedToId?: string;
}

export class AddFraudActionDto {
  @IsString() action: string;
}

export class CreateFraudFlagDto {
  @IsString() userId: string;
  @IsIn(['CUSTOMER', 'COMPANION']) userType: string;
  @IsString() category: string;
  @IsString() description: string;
  @IsInt() @Min(0) @Max(100) @Type(() => Number) riskScore: number;
}
