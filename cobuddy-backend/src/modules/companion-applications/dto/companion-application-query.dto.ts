import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export const APPLICATION_STATUSES = [
  'SUBMITTED',
  'SCREENING',
  'INTERVIEW_SCHEDULED',
  'APPROVED',
  'REJECTED',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export class CompanionApplicationQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(APPLICATION_STATUSES) status?: ApplicationStatus;
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @IsString() search?: string;
}
