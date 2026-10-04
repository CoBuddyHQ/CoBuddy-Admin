import axios from '@/lib/api/client';
import { LiveBookingMarker } from './types';

export const liveMapApi = {
  getLiveBookings: async (): Promise<LiveBookingMarker[]> => {
    const response = await axios.get('/operations/live-map/active-bookings');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.flatMap((booking: any) => {
      const snapshot = booking.venueSnapshot ?? {};
      const latitude = booking.venue?.lat ?? snapshot.lat;
      const longitude = booking.venue?.lng ?? snapshot.lng;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return [];
      return [
        {
          id: booking.id,
          sessionId: booking.bookingRef,
          companionName: booking.companion?.name ?? 'Unassigned',
          userName: booking.customer?.name ?? 'Unknown',
          latitude,
          longitude,
          status: booking.status,
        },
      ];
    });
  },
};
