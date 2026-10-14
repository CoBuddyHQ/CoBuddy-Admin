import { ChatSettings } from './types';
import axios from '@/lib/api/client';

const mapSettings = (item: any): ChatSettings => ({
  enableImageSharing: item.allowedMediaTypes?.includes('image/*') ?? false,
  enableVoiceNotes: item.allowedMediaTypes?.includes('audio/*') ?? false,
  maxMessageLength: item.maxMessageLength,
  autoFilterProfanity: item.enableProfanityFilter ?? false,
  retainChatHistoryDays: null,
  otherMediaTypes: (item.allowedMediaTypes ?? '')
    .split(',')
    .map((type: string) => type.trim())
    .filter((type: string) => type && !['image/*', 'audio/*'].includes(type)),
});

export const chatSettingsApi = {
  getSettings: async (): Promise<ChatSettings> => {
    const response = await axios.get('/moderation/chat-settings');
    return mapSettings(response.data.data);
  },
  updateSettings: async (settings: ChatSettings): Promise<void> => {
    const mediaTypes: string[] = [...settings.otherMediaTypes];
    if (settings.enableImageSharing) mediaTypes.push('image/*');
    if (settings.enableVoiceNotes) mediaTypes.push('audio/*');
    await axios.put('/moderation/chat-settings', {
      enableProfanityFilter: settings.autoFilterProfanity,
      maxMessageLength: settings.maxMessageLength,
      allowedMediaTypes: mediaTypes.join(','),
    });
  },
};
