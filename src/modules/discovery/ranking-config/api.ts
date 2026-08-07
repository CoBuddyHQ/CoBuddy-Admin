import { UIDiscoverySettings } from './types';

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
