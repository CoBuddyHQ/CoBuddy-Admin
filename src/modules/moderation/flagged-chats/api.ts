import { FlaggedChatSummary, FlaggedChatDetail } from './types';

const mockChats: FlaggedChatSummary[] = [
  { id: 'FC-101', participants: ['UserA', 'CompB'], flagReason: 'Off-platform payment', confidenceScore: 0.95, timestamp: new Date().toISOString(), status: 'PENDING' },
  { id: 'FC-102', participants: ['UserC', 'CompD'], flagReason: 'Inappropriate language', confidenceScore: 0.88, timestamp: new Date().toISOString(), status: 'PENDING' },
];

const mockDetail: FlaggedChatDetail = {
  ...mockChats[0],
  messages: [
    { id: 'M1', sender: 'UserA', content: 'Hi, can we meet?', timestamp: new Date(Date.now() - 50000).toISOString(), isFlagged: false },
    { id: 'M2', sender: 'CompB', content: 'Yes, but please book through the app.', timestamp: new Date(Date.now() - 40000).toISOString(), isFlagged: false },
    { id: 'M3', sender: 'UserA', content: 'Can I just GPay you directly to avoid fees?', timestamp: new Date(Date.now() - 10000).toISOString(), isFlagged: true },
  ],
  senderHistory: {
    previousFlags: 2,
    warnings: 1
  }
};

export const flaggedChatApi = {
  getChats: async (): Promise<FlaggedChatSummary[]> => Promise.resolve([...mockChats]),
  getDetail: async (id: string): Promise<FlaggedChatDetail> => {
    return Promise.resolve({ ...mockDetail, id });
  },
  takeAction: async (id: string, action: 'DISMISS' | 'WARN' | 'ESCALATE', notes: string): Promise<void> => {
    const chat = mockChats.find(c => c.id === id);
    if (chat) {
      chat.status = action === 'DISMISS' ? 'DISMISSED' : action === 'WARN' ? 'WARNED' : 'ESCALATED';
    }
    return Promise.resolve();
  }
};
