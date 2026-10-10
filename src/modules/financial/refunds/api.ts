import axios from '@/lib/api/client';
import { RefundRequest, BookingSettings } from './types';
import type { Paginated } from '@/types/pagination';

const mapRefund = (item: any): RefundRequest => ({
  id: item.id,
  bookingId: item.bookingId,
  userId: item.requestedById,
  userName: item.requestedById,
  amount: Number(item.amount ?? 0),
  reason: item.reason,
  evidenceUrls: [],
  status: item.status,
  requestedAt: item.createdAt,
});

export const refundsApi = {
  getRefunds: async (page = 1): Promise<Paginated<RefundRequest>> => {
    const response = await axios.get('/financial/refunds', { params: { page, pageSize: 20 } });
    const items = response.data.data?.data ?? response.data.data ?? [];
    return { data: items.map(mapRefund), meta: response.data.meta };
  },
  processRefund: async (id: string, action: 'APPROVE' | 'REJECT' | 'PROCESS'): Promise<void> => {
    if (action === 'APPROVE') {
      await axios.post('/financial/refunds/' + id + '/approve', {});
    } else if (action === 'REJECT') {
      await axios.post('/financial/refunds/' + id + '/reject', { reason: 'Rejected by admin' });
    } else {
      await axios.post('/financial/refunds/' + id + '/process');
    }
  },
  getSettings: async (): Promise<BookingSettings> => {
    const response = await axios.get('/financial/refunds/settings/booking');
    return response.data.data;
  },
  updateSettings: async (settings: BookingSettings): Promise<void> => {
    await axios.put('/financial/refunds/settings/booking', settings);
  },
};
