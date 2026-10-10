import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { ReportStatus } from '@prisma/client';

export class ListReportsDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(ReportStatus) status?: ReportStatus;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsUUID() assignedToId?: string;
}

export class AssignReportDto {
  @IsOptional() @IsUUID() staffId?: string;
}

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus) status: ReportStatus;
  @IsOptional() @IsString() note?: string;
}

export class BanUserFromReportDto {
  @IsEnum(['TEMPORARY_24H', 'TEMPORARY_7D', 'TEMPORARY_30D', 'PERMANENT'])
  duration: 'TEMPORARY_24H' | 'TEMPORARY_7D' | 'TEMPORARY_30D' | 'PERMANENT';
  @IsString() reason: string;
}

export class IssueWarningDto {
  @IsString() message: string;
}
