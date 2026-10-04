import { BookingDispute } from './types';
import { refundsApi } from '../../financial/refunds/api';
import axios from '@/lib/api/client';

export function getRefundPercentForNotice(noticeHours: number, tiers: any[]): number {
  const tier = tiers.find(
    (item) =>
      noticeHours >= item.noticeHoursMin &&
      (item.noticeHoursMax === null || noticeHours < item.noticeHoursMax),
  );
  return tier ? tier.refundPercent : 0;
}

const toUiStatus = (status: string, note?: string): BookingDispute['status'] => {
  if (note?.startsWith('[ESCALATED]')) return 'ESCALATED';
  if (status === 'PROCESSED') return 'RESOLVED_REFUND';
  if (status === 'REJECTED') return 'RESOLVED_NO_REFUND';
  if (status === 'APPROVED') return 'INVESTIGATING';
  return 'OPEN';
};

export const disputesApi = {
  getDisputes: async (): Promise<BookingDispute[]> => {
    const [response, settings] = await Promise.all([
      axios.get('/bookings/disputes'),
      refundsApi.getSettings(),
    ]);
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((item: any) => {
      const booking = item.booking ?? {};
      const noticeGivenHours = Math.max(
        0,
        Math.round(
          (new Date(booking.startTime).getTime() - new Date(item.createdAt).getTime()) / 3_600_000,
        ),
      );
      const overridePercent = item.resolutionNote?.match(/Penalty override\\s+([\\d.]+)%/)?.[1];
      return {
        id: item.id,
        bookingId: booking.bookingRef ?? item.bookingId,
        customerId: booking.customer?.id ?? '',
        companionId: booking.companion?.id ?? '',
        raisedBy: item.raisedBy === 'COMPANION' ? 'COMPANION' : 'CUSTOMER',
        reasonCode: item.disputeReasonId,
        reasonDetails: item.description,
        status: toUiStatus(item.status, item.resolutionNote),
        amount: Number(booking.bookingAmount ?? item.refundAmount ?? 0),
        noticeGivenHours,
        calculatedPenaltyPercent: overridePercent
          ? Number(overridePercent)
          : getRefundPercentForNotice(noticeGivenHours, settings.cancellationRefundTiers),
        overrideReason: overridePercent ? item.resolutionNote : undefined,
        createdAt: item.createdAt,
      };
    });
  },

  updateDisputeStatus: async (id: string, status: BookingDispute['status']): Promise<void> => {
    await axios.patch('/bookings/disputes/' + id + '/status', { status });
  },

  overridePenalty: async (id: string, newPenalty: number, reason: string): Promise<void> => {
    await axios.post('/bookings/disputes/' + id + '/penalty-override', {
      percent: newPenalty,
      reason,
    });
  },
};
