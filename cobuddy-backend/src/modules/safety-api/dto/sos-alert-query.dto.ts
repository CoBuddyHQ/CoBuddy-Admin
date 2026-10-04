import { IsIn, IsOptional } from 'class-validator';

export class SosAlertQueryDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  activeOnly?: 'true' | 'false';
}
