export interface UIDiscoverySettings {
  enableDarkThemeDefault: boolean;
  homeScreenLayout: 'GRID' | 'LIST' | 'MAP_FIRST';
  featuredSectionTitle: string;
  maxFeaturedCompanions: number;
}

export interface RankingWeights {
  trustScoreWeight: number;
  ratingWeight: number;
  responseTimeWeight: number;
  acceptRateWeight: number;
  sessionCompletionWeight: number;
  proximityBonusWeight: number;
  newCompanionBoostPercent: number;
}

export interface PromotedCompanion {
  id: string;
  name: string;
  promotedUntil: string;
}
