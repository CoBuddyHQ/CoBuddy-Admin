import { IsBoolean, IsIn, IsNumber, Max, Min } from 'class-validator';

export class MatchmakingConfigDto {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.1)
  @Max(500)
  maxSearchRadiusKm: number;

  @IsIn(['RATING_BASED', 'DISTANCE_BASED', 'NEW_COMPANION_BOOST'])
  priorityAlgorithm: 'RATING_BASED' | 'DISTANCE_BASED' | 'NEW_COMPANION_BOOST';

  @IsBoolean()
  allowCrossCityBooking: boolean;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(5)
  minRatingThreshold: number;
}
