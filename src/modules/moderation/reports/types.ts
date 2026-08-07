export interface ReportSummary {
  id: string;
  reporterId: string;
  reportedUserId: string;
  category: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
  timestamp: string;
  bookingId?: string;
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
