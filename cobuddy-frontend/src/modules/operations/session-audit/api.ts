import axios from '@/lib/api/client';
import { SessionAuditLog, SessionAuditFilters } from './types';

export const sessionAuditApi = {
  getLogs: async (filters?: SessionAuditFilters): Promise<SessionAuditLog[]> => {
    const response = await axios.get('/operations/session-audit', {
      params: {
        sessionId: filters?.sessionId,
        dateFrom: filters?.dateRange?.start,
        dateTo: filters?.dateRange?.end,
      },
    });
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((entry: any) => ({
      id: entry.id,
      sessionId: entry.booking?.bookingRef ?? entry.bookingId,
      timestamp: entry.timestamp,
      action: entry.eventType,
      actorType: entry.actorType ?? 'SYSTEM',
      actorId: entry.actorId ?? 'SYSTEM',
      details:
        typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details ?? {}),
    }));
  },
};
