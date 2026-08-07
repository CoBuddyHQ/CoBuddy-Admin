import { MatchmakingConfig } from './types';

let mockConfig: MatchmakingConfig = {
  maxSearchRadiusKm: 25,
  priorityAlgorithm: 'RATING_BASED',
  allowCrossCityBooking: false,
  minRatingThreshold: 3.5,
};

export const matchmakingApi = {
  getConfig: async (): Promise<MatchmakingConfig> => Promise.resolve({ ...mockConfig }),
  updateConfig: async (config: MatchmakingConfig): Promise<void> => {
    mockConfig = { ...config };
    return Promise.resolve();
  }
};
