import {
  CompanionRecord,
  TrustScoreHistoryEntry,
  SessionHistoryEntry,
  EarningsBreakdown,
} from './types';
import axios from '@/lib/api/client';

const mapCompanion = (item: any): CompanionRecord => ({
  id: item.id,
  name: item.name,
  email: item.email || '',
  phone: item.phone,
  joinDate: item.joinDate || item.createdAt,
  verificationStatus: item.verificationStatus,
  trustScore: item.trustScore ?? 0,
  totalEarnings: Number(item.totalEarnings ?? 0),
  totalSessions: item.totalSessions ?? 0,
  status: item.status,
});

export const companionsApi = {
  getCompanions: async (): Promise<CompanionRecord[]> => {
    const res = await axios.get('/companions', { params: { page: 1, pageSize: 100 } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapCompanion);
  },
  getCompanionById: async (id: string): Promise<CompanionRecord | undefined> => {
    const res = await axios.get(`/companions/${id}`);
    return mapCompanion(res.data.data);
  },
  updateStatus: async (id: string, status: CompanionRecord['status']): Promise<void> => {
    await axios.patch(`/companions/${id}/status`, { status });
  },
  getTrustScoreHistory: async (id: string): Promise<TrustScoreHistoryEntry[]> => {
    const res = await axios.get(`/companions/${id}/trust-score-history`);
    const items = res.data.data ?? [];
    return items.map((e: any) => ({
      id: e.id,
      date: e.date,
      oldScore: e.oldScore,
      newScore: e.newScore,
      reason: e.reason,
    }));
  },
  getSessionHistory: async (id: string): Promise<SessionHistoryEntry[]> => {
    const res = await axios.get(`/companions/${id}/session-history`, {
      params: { page: 1, pageSize: 50 },
    });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map((s: any) => ({
      id: s.id,
      date: s.startTime || s.createdAt,
      customerName: s.customer?.name ?? 'N/A',
      activity: s.activityLabel,
      durationMins: s.durationMins,
      earnings: Number(s.companionNetAmount ?? 0),
    }));
  },
  getEarningsBreakdown: async (id: string): Promise<EarningsBreakdown> => {
    const res = await axios.get(`/companions/${id}/earnings-breakdown`);
    const d = res.data.data;
    return {
      baseEarnings: Number(d.baseEarnings ?? 0),
      bonusEarnings: Number(d.bonusEarnings ?? 0),
      platformFeeDeducted: Number(d.platformFeeDeducted ?? 0),
      totalNet: Number(d.totalNet ?? 0),
    };
  },
};
