import { IsOptional, IsString, IsInt, IsBoolean, IsObject, IsIn } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class ListRiskScoresDto extends PaginationQueryDto {
  @IsOptional() @IsString() userType?: string;
}

export class ReclassifyRiskScoreDto {
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class UpdateRiskConfigDto {
  @IsOptional() @IsInt() minRiskScoreForReview?: number;
  @IsOptional() @IsInt() autoSuspendThreshold?: number;
  @IsOptional() @IsBoolean() enableAutoFlags?: boolean;
  @IsOptional() @IsObject() categoryWeights?: Record<string, number>;
}
