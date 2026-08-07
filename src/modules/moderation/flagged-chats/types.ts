export interface FlaggedChatSummary {
  id: string;
  participants: string[];
  flagReason: string;
  confidenceScore: number;
  timestamp: string;
  status: 'PENDING' | 'DISMISSED' | 'WARNED' | 'ESCALATED';
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isFlagged: boolean;
}

export interface FlaggedChatDetail extends FlaggedChatSummary {
  messages: ChatMessage[];
  senderHistory: {
    previousFlags: number;
    warnings: number;
  };
}
