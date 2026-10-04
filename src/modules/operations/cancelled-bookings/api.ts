import axios from '@/lib/api/client';
import { CancelledBooking } from './types';

export const cancelledBookingsApi = {
  getBookings: async (): Promise<CancelledBooking[]> => {
    const response = await axios.get('/operations/cancelled-bookings');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((booking: any) => ({
      id: booking.id,
      sessionId: booking.bookingRef,
      companionName: booking.companion?.name ?? 'Unassigned',
      userName: booking.customer?.name ?? 'Unknown',
      cancelledBy:
        booking.status === 'CUSTOMER_CANCELLED' || booking.status === 'NO_SHOW_CUSTOMER'
          ? 'CUSTOMER'
          : booking.status === 'ADMIN_CANCELLED'
            ? 'SYSTEM'
            : 'COMPANION',
      reasonCode:
        booking.customerCancelReasonId ?? booking.companionCancelReasonId ?? booking.status,
      reasonDetails: booking.adminCancelNote ?? undefined,
      penaltyApplied: 0,
      refundAmount: Number(booking.disputes?.[0]?.refundAmount ?? 0),
      dateCancelled: booking.statusChangedAt,
    }));
  },
};
