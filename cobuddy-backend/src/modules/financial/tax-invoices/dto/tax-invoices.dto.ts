import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class ListInvoicesDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['DRAFT', 'ISSUED', 'PAID', 'CANCELLED']) status?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() companionId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

export class IssueInvoiceDto {
  @IsOptional() @IsString() note?: string;
}
