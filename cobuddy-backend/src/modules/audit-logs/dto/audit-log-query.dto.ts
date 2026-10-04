import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class AuditLogQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() adminId?: string;
  @IsOptional() @IsString() moduleAffected?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @Type(() => Date) from?: Date;
  @IsOptional() @Type(() => Date) to?: Date;
  @IsOptional() @IsString() resourceType?: string;
  @IsOptional() @IsString() resourceId?: string;
}
