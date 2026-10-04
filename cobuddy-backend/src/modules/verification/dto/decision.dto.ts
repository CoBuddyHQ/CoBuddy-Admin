import { IsString, IsIn, ValidateIf, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { VerificationStatus } from '@prisma/client';

export class DecisionDto {
  @IsIn(['APPROVED', 'REJECTED', 'REQUEST_RESUBMISSION'])
  decision: Extract<VerificationStatus, 'APPROVED' | 'REJECTED' | 'REQUEST_RESUBMISSION'>;

  @ValidateIf((dto, value) => dto.decision !== 'APPROVED' || value !== undefined)
  @Transform(({ obj, key }) => (typeof obj[key] === 'string' ? obj[key].trim() : obj[key]))
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => (typeof obj[key] === 'string' ? obj[key].trim() : obj[key]))
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
