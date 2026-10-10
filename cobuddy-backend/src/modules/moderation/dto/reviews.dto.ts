import { IsOptional, IsEnum, IsString, IsArray, IsInt, Min, Max } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { ReviewModerationStatus } from '@prisma/client';

export class ListReviewsDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(ReviewModerationStatus) status?: ReviewModerationStatus;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tagCodes?: string[];
}

export class RemoveReviewDto {
  @IsString() reason: string;
}
