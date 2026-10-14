export interface ChatSettings {
  otherMediaTypes: string[];
  enableImageSharing: boolean;
  enableVoiceNotes: boolean;
  maxMessageLength: number;
  autoFilterProfanity: boolean;
  retainChatHistoryDays: number | null;
}
