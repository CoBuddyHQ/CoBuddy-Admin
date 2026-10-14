import { FlaggedChatSummary, FlaggedChatDetail } from './types';
import axios from '@/lib/api/client';

const mapChat = (item: any): FlaggedChatSummary => ({
  id: item.id,
  participants: [item.senderId, item.receiverId],
  flagReason: item.reason,
  confidenceScore: null,
  timestamp: item.flaggedAt || item.createdAt,
  status: item.status === 'REVIEWED' ? 'DISMISSED' : item.status,
});

export const flaggedChatApi = {
  getChats: async (): Promise<FlaggedChatSummary[]> => {
    const res = await axios.get('/moderation/flagged-chats', {
      params: { page: 1, pageSize: 100 },
    });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapChat);
  },
  getDetail: async (id: string): Promise<FlaggedChatDetail> => {
    const res = await axios.get(`/moderation/flagged-chats/${id}`);
    const item = res.data.data;
    return {
      ...mapChat(item),
      messages: (item.transcript ?? []).map((m: any) => ({
        id: m.id,
        sender: m.senderId,
        content: m.text,
        timestamp: m.at,
        isFlagged: m.flagged ?? false,
      })),
      senderHistory: { previousFlags: null, warnings: null },
    };
  },
  takeAction: async (
    id: string,
    action: 'DISMISS' | 'WARN' | 'ESCALATE',
    notes: string,
  ): Promise<void> => {
    await axios.post(`/moderation/flagged-chats/${id}/decide`, { action, note: notes });
  },
};
