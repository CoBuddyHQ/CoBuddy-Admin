import axios from '@/lib/api/client';
import { CompletedBooking } from './types';

export const completedBookingsApi = {
  getBookings: async (): Promise<CompletedBooking[]> => {
    const response = await axios.get('/operations/completed-bookings');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((booking: any) => ({
      id: booking.id,
      sessionId: booking.bookingRef,
      companionName: booking.companion?.name ?? 'Unassigned',
      userName: booking.customer?.name ?? 'Unknown',
      durationMinutes: booking.durationMins,
      totalCost: Number(booking.bookingAmount ?? 0),
      rating: null,
      dateCompleted: booking.updatedAt,
    }));
  },
};
