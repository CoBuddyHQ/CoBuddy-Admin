import { UIDiscoverySettings, RankingWeights, PromotedCompanion } from './types';

let mockSettings: UIDiscoverySettings = {
  enableDarkThemeDefault: false,
  homeScreenLayout: 'GRID',
  featuredSectionTitle: 'Trending Companions',
  maxFeaturedCompanions: 10,
};

export const uiDiscoveryApi = {
  getSettings: async (): Promise<UIDiscoverySettings> => Promise.resolve({ ...mockSettings }),
  updateSettings: async (settings: UIDiscoverySettings): Promise<void> => {
    mockSettings = { ...settings };
    return Promise.resolve();
  }
};

let mockWeights: RankingWeights = {
  trustScoreWeight: 50,
  distanceWeight: 30,
  availabilityWeight: 20,
  newCompanionBoostPercent: 15,
};

let mockPromoted: PromotedCompanion[] = [
  { id: 'C-001', name: 'Riya S.', promotedUntil: '2026-08-15' }
];

export const rankingConfigApi = {
  getWeights: async (): Promise<RankingWeights> => Promise.resolve({ ...mockWeights }),
  updateWeights: async (weights: RankingWeights): Promise<void> => {
    mockWeights = { ...weights };
    return Promise.resolve();
  },
  getPromoted: async (): Promise<PromotedCompanion[]> => Promise.resolve([...mockPromoted]),
  addPromoted: async (c: Omit<PromotedCompanion, 'id'>): Promise<void> => {
    mockPromoted.push({ ...c, id: `C-${Math.floor(Math.random()*1000)}` });
    return Promise.resolve();
  },
  removePromoted: async (id: string): Promise<void> => {
    mockPromoted = mockPromoted.filter(p => p.id !== id);
    return Promise.resolve();
  }
};
