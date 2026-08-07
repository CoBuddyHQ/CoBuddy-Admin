import { ChatSettings } from './types';

let mockSettings: ChatSettings = {
  enableImageSharing: false,
  enableVoiceNotes: true,
  maxMessageLength: 1000,
  autoFilterProfanity: true,
  retainChatHistoryDays: 30,
};

export const chatSettingsApi = {
  getSettings: async (): Promise<ChatSettings> => Promise.resolve({ ...mockSettings }),
  updateSettings: async (settings: ChatSettings): Promise<void> => {
    mockSettings = { ...settings };
    return Promise.resolve();
  }
};
