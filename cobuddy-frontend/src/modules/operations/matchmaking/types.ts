export interface MatchmakingConfig {
  maxSearchRadiusKm: number;
  priorityAlgorithm: 'RATING_BASED' | 'DISTANCE_BASED' | 'NEW_COMPANION_BOOST';
  allowCrossCityBooking: boolean;
  minRatingThreshold: number;
}
