import { unavailableFeature } from '@/lib/unavailable-feature';
import { UIDiscoverySettings, RankingWeights, PromotedCompanion } from './types';
export const uiDiscoveryApi = {
  getSettings: async (): Promise<UIDiscoverySettings> => {
    return unavailableFeature('discovery/ranking-config');
  },
  updateSettings: async (_settings: UIDiscoverySettings): Promise<void> => {
    return unavailableFeature('discovery/ranking-config');
  },
};
export const rankingConfigApi = {
  getWeights: async (): Promise<RankingWeights> => {
    return unavailableFeature('discovery/ranking-config');
  },
  updateWeights: async (_weights: RankingWeights): Promise<void> => {
    return unavailableFeature('discovery/ranking-config');
  },
  getPromoted: async (): Promise<PromotedCompanion[]> => {
    return unavailableFeature('discovery/ranking-config');
  },
  addPromoted: async (_c: Omit<PromotedCompanion, 'id'>): Promise<void> => {
    return unavailableFeature('discovery/ranking-config');
  },
  removePromoted: async (_id: string): Promise<void> => {
    return unavailableFeature('discovery/ranking-config');
  },
};
