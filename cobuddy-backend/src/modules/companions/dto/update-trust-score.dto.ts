import { IsNumber, IsString, Min, Max } from 'class-validator';

export class UpdateTrustScoreDto {
  @IsNumber() @Min(0) @Max(100) newScore: number;
  @IsString() reason: string;
}
