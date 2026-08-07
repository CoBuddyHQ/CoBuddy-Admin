import { GlobalSettings } from './types';

let mockSettings: GlobalSettings = {
  contactEmail: 'support@cobuddy.app',
  supportPhone: '+91 9876543210',
  termsUrl: 'https://cobuddy.app/terms',
  privacyUrl: 'https://cobuddy.app/privacy',
  defaultCurrency: 'INR',
  defaultLanguage: 'English',
};

export const globalSettingsApi = {
  getSettings: async (): Promise<GlobalSettings> => Promise.resolve({ ...mockSettings }),
  updateSettings: async (settings: GlobalSettings): Promise<void> => {
    mockSettings = { ...settings };
    return Promise.resolve();
  }
};
