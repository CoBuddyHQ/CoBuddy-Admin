import { ChatSettings } from './types';
import axios from '@/lib/api/client';

const mapSettings = (item: any): ChatSettings => ({
  enableImageSharing: item.allowedMediaTypes?.includes('image/*') ?? false,
  enableVoiceNotes: item.allowedMediaTypes?.includes('video/*') ?? false,
  maxMessageLength: item.maxMessageLength ?? 1000,
  autoFilterProfanity: item.enableProfanityFilter ?? false,
  retainChatHistoryDays: 30,
});

export const chatSettingsApi = {
  getSettings: async (): Promise<ChatSettings> => {
    const response = await axios.get('/moderation/chat-settings');
    return mapSettings(response.data.data);
  },
  updateSettings: async (settings: ChatSettings): Promise<void> => {
    const mediaTypes: string[] = [];
    if (settings.enableImageSharing) mediaTypes.push('image/*');
    if (settings.enableVoiceNotes) mediaTypes.push('video/*');
    await axios.put('/moderation/chat-settings', {
      enableProfanityFilter: settings.autoFilterProfanity,
      maxMessageLength: settings.maxMessageLength,
      allowedMediaTypes: mediaTypes.join(','),
    });
  },
};
