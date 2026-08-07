import { AppConfig } from './types';

let mockConfig: AppConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please try again later.',
  forceUpdateIos: true,
  minVersionIos: '1.2.0',
  forceUpdateAndroid: false,
  minVersionAndroid: '1.1.5',
  maxDailyBookingsPerUser: 3,
};

export const appConfigsApi = {
  getConfig: async (): Promise<AppConfig> => Promise.resolve({ ...mockConfig }),
  updateConfig: async (config: AppConfig): Promise<void> => {
    mockConfig = { ...config };
    return Promise.resolve();
  }
};
