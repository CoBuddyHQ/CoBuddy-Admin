export interface ReportSummary {
  id: string;
  reportRef?: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId: string;
  reportedUserName?: string;
  reportedUserBanStatus?: 'BANNED' | 'ACTIVE';
  category: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
  timestamp: string;
  bookingId?: string;
  assignedTo?: string;
}

export interface ReportDetail extends ReportSummary {
  description: string;
  evidenceUrls: string[];
  investigatorNotes: {
    timestamp: string;
    note: string;
    author: string;
  }[];
}
