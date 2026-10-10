import { IsInt, IsBoolean, IsEnum, Min, Max, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { KYCProvider } from '@prisma/client';

export class UpdateThresholdsDto {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => obj[key])
  @IsInt()
  @Min(0)
  @Max(100)
  autoApproveThreshold?: number;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => obj[key])
  @IsInt()
  @Min(0)
  @Max(100)
  autoRejectThreshold?: number;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ obj, key }) => obj[key])
  @IsBoolean()
  livenessRequired?: boolean;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(KYCProvider)
  enabledProvider?: KYCProvider;
}
