import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateDisputeStatusDto {
  @IsIn(['INVESTIGATING', 'ESCALATED', 'REFUND_PENDING', 'RESOLVED_NO_REFUND'])
  status: 'INVESTIGATING' | 'ESCALATED' | 'REFUND_PENDING' | 'RESOLVED_NO_REFUND';

  @IsInt()
  @Min(0)
  @Transform(({ obj }) => obj.version)
  version: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ obj }) => obj.note)
  @IsString()
  @MaxLength(2000)
  @Matches(/\S/)
  note?: string;
}

export class OverrideDisputeRefundDto {
  @Transform(({ obj }) => obj.percent)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percent: number;

  @Transform(({ obj }) => obj.reason)
  @IsString()
  @MaxLength(2000)
  @Matches(/\S/)
  reason: string;

  @IsInt()
  @Min(0)
  @Transform(({ obj }) => obj.version)
  version: number;
}
