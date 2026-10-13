import axios from '@/lib/api/client';
import { UIDiscoverySettings, RankingWeights, PromotedCompanion } from './types';
export const uiDiscoveryApi = {
  getSettings: async (): Promise<UIDiscoverySettings> =>
    (await axios.get('/discovery/ranking-config/settings')).data.data,
  updateSettings: async (settings: UIDiscoverySettings): Promise<void> => {
    await axios.put('/discovery/ranking-config/settings', settings);
  },
};
export const rankingConfigApi = {
  getWeights: async (): Promise<RankingWeights> =>
    (await axios.get('/discovery/ranking-config')).data.data,
  updateWeights: async (weights: RankingWeights): Promise<void> => {
    await axios.put('/discovery/ranking-config', weights);
  },
  getPromoted: async (): Promise<PromotedCompanion[]> =>
    (await axios.get('/discovery/ranking-config/promoted')).data.data,
  addPromoted: async (c: { companionId: string; promotedUntil: string }): Promise<void> => {
    await axios.post('/discovery/ranking-config/promoted', c);
  },
  removePromoted: async (id: string): Promise<void> => {
    await axios.delete('/discovery/ranking-config/promoted/' + encodeURIComponent(id));
  },
};
