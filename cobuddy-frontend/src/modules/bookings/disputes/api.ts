import { BookingDispute } from './types';
import axios from '@/lib/api/client';

export const disputesApi = {
  getDisputes: async (): Promise<BookingDispute[]> => {
    const response = await axios.get('/bookings/disputes');
    const rows = response.data.data?.data ?? response.data.data;
    if (!Array.isArray(rows)) throw new Error('Invalid dispute response');
    return rows.map((item) => {
      const booking = item.booking ?? {};
      return {
        id: item.id,
        version: item.version,
        bookingId: booking.bookingRef ?? item.bookingId,
        customerId: booking.customer?.id ?? '',
        companionId: booking.companion?.id ?? '',
        raisedBy: item.raisedBy === 'COMPANION' ? 'COMPANION' : 'CUSTOMER',
        reasonCode: item.disputeReasonId,
        reasonDetails: item.description,
        status: item.workflowStatus,
        amount: Number(booking.bookingAmount),
        refundAmount: item.refundAmount == null ? null : Number(item.refundAmount),
        refundPercent: item.overridePercent ?? null,
        overrideReason: item.overrideReason ?? undefined,
        createdAt: item.createdAt,
      };
    });
  },

  updateDisputeStatus: async (
    id: string,
    version: number,
    status: BookingDispute['status'],
    note?: string,
  ): Promise<void> => {
    await axios.patch('/bookings/disputes/' + encodeURIComponent(id) + '/status', {
      status,
      version,
      ...(note ? { note } : {}),
    });
  },

  overridePenalty: async (
    id: string,
    version: number,
    newPenalty: number,
    reason: string,
  ): Promise<void> => {
    await axios.post('/bookings/disputes/' + encodeURIComponent(id) + '/penalty-override', {
      version,
      percent: newPenalty,
      reason,
    });
  },
};
