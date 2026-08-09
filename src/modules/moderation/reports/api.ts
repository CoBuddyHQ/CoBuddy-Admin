import { ReportSummary, ReportDetail } from './types';

const mockReports: ReportSummary[] = [
  { id: 'REP-001', reporterId: 'UserA', reportedUserId: 'CompB', category: 'Inappropriate Behavior', status: 'OPEN', timestamp: new Date().toISOString(), bookingId: 'BKG-991' },
  { id: 'REP-002', reporterId: 'CompC', reportedUserId: 'UserD', category: 'No Show', status: 'INVESTIGATING', timestamp: new Date(Date.now() - 86400000).toISOString(), bookingId: 'BKG-992', assignedTo: 'Admin User' },
];

const mockDetail: ReportDetail = {
  ...mockReports[0],
  description: 'The companion was rude and asked for direct payment.',
  evidenceUrls: ['https://example.com/screenshot1.jpg'],
  investigatorNotes: []
};

export const reportApi = {
  getReports: async (): Promise<ReportSummary[]> => Promise.resolve([...mockReports]),
  getDetail: async (id: string): Promise<ReportDetail> => {
    const sum = mockReports.find(r => r.id === id);
    if (sum) return Promise.resolve({ ...mockDetail, ...sum, id });
    return Promise.resolve({ ...mockDetail, id });
  },
  updateStatus: async (id: string, status: ReportSummary['status'], note?: string, author?: string): Promise<void> => {
    const report = mockReports.find(r => r.id === id);
    if (report) report.status = status;
    if (note && author && id === mockDetail.id) {
      mockDetail.investigatorNotes.push({ timestamp: new Date().toISOString(), note, author });
      mockDetail.status = status;
    }
    return Promise.resolve();
  },
  assignToMe: async (id: string, staffName: string): Promise<void> => {
    const report = mockReports.find(r => r.id === id);
    if (report) report.assignedTo = staffName;
    return Promise.resolve();
  }
};
