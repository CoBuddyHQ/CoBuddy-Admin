import { IsString, IsEnum, IsOptional, IsUUID, IsIn } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class CreateBanDto {
  @IsUUID() userId: string;
  @IsIn(['CUSTOMER', 'COMPANION']) userType: string;
  @IsString() reason: string;
  @IsEnum(['TEMPORARY_24H', 'TEMPORARY_7D', 'TEMPORARY_30D', 'PERMANENT'])
  duration: 'TEMPORARY_24H' | 'TEMPORARY_7D' | 'TEMPORARY_30D' | 'PERMANENT';
  @IsOptional() @IsUUID() reportId?: string;
}

export class LiftBanDto {
  @IsString() reason: string;
}

export class ListBansDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsIn(['CUSTOMER', 'COMPANION']) userType?: string;
}
