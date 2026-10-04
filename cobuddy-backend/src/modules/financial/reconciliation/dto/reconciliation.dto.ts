import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class ListReconciliationDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['MATCHED', 'MISMATCHED', 'PENDING']) matchStatus?: string;
  @IsOptional() @IsString() gateway?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class ResolveReconciliationDto {
  @IsOptional() @IsString() mismatchNote?: string;
  @IsIn(['MATCHED', 'MISMATCHED']) matchStatus: string;
}
