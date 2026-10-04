import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max, IsIn, IsArray } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize = 20;
}

export class FilterQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc' = 'desc';
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @IsArray() roles?: string[];
}

export const SORT_BY_ALLOWLIST = {
  staffEmployees: ['createdAt', 'name', 'updatedAt', 'lastLoginAt', 'department'],
  auditLogs: ['timestamp'],
  customers: ['createdAt', 'name', 'joinDate'],
  companions: ['createdAt', 'name', 'joinDate', 'trustScore', 'totalEarnings'],
  bookings: ['createdAt', 'startTime', 'bookingAmount'],
  payouts: ['createdAt', 'dueDate', 'amount'],
  tickets: ['createdAt', 'slaDeadline', 'priority'],
  reports: ['createdAt', 'status'],
  incidents: ['createdAt', 'status'],
  sosAlerts: ['createdAt', 'status'],
} as const;

export function validateSortBy(
  entity: keyof typeof SORT_BY_ALLOWLIST,
  sortBy: string | undefined,
): string {
  if (!sortBy) return 'createdAt';
  if ((SORT_BY_ALLOWLIST[entity] as readonly string[]).includes(sortBy)) return sortBy;
  return 'createdAt';
}
