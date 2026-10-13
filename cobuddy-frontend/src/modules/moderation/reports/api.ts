import { ReportSummary, ReportDetail } from './types';
import axios from '@/lib/api/client';

const mapReport = (item: any): ReportSummary => ({
  id: item.id,
  reporterId: item.reporterId,
  reportedUserId: item.reportedUserId,
  category: item.categoryCode,
  status: item.status,
  timestamp: item.createdAt,
  bookingId: item.bookingId,
  assignedTo: item.assignedTo?.name,
});

export const reportApi = {
  getReports: async (): Promise<ReportSummary[]> => {
    const res = await axios.get('/moderation/reports', { params: { page: 1, pageSize: 100 } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapReport);
  },
  getDetail: async (id: string): Promise<ReportDetail> => {
    const res = await axios.get(`/moderation/reports/${id}`);
    const item = res.data.data;
    return {
      ...mapReport(item),
      description: item.description,
      evidenceUrls: item.evidenceUrls ?? [],
      investigatorNotes: Array.isArray(item.notes)
        ? item.notes.map((n: any) => ({ timestamp: n.at, note: n.note, author: n.by }))
        : [],
    };
  },
  updateStatus: async (
    id: string,
    status: ReportSummary['status'],
    note?: string,
  ): Promise<void> => {
    await axios.patch(`/moderation/reports/${id}/status`, { status, note });
  },
  assignToMe: async (id: string): Promise<void> => {
    await axios.post(`/moderation/reports/${id}/assign-me`);
  },
};
