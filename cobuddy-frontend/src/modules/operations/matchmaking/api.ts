import axios from '@/lib/api/client';
import { MatchmakingConfig } from './types';

export const matchmakingApi = {
  getConfig: async (): Promise<MatchmakingConfig> => {
    const response = await axios.get<{ data: MatchmakingConfig }>('/operations/matchmaking/config');
    return response.data.data;
  },
  updateConfig: async (config: MatchmakingConfig): Promise<void> => {
    await axios.put('/operations/matchmaking/config', config);
  },
};
