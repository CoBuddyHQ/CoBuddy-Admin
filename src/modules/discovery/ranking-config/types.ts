export interface UIDiscoverySettings {
  enableDarkThemeDefault: boolean;
  homeScreenLayout: 'GRID' | 'LIST' | 'MAP_FIRST';
  featuredSectionTitle: string;
  maxFeaturedCompanions: number;
}

export interface RankingWeights {
  trustScoreWeight: number;
  distanceWeight: number;
  availabilityWeight: number;
  newCompanionBoostPercent: number;
}

export interface PromotedCompanion {
  id: string;
  name: string;
  promotedUntil: string;
}
