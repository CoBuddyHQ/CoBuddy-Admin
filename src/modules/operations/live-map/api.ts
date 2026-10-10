import axios from '@/lib/api/client';
import { LiveBookingMarker } from './types';

export const liveMapApi = {
  getLiveBookings: async (): Promise<LiveBookingMarker[]> => {
    const response = await axios.get('/operations/live-map/active-bookings');
    const rows = response.data.data?.data ?? response.data.data;
    if (!Array.isArray(rows)) throw new Error('Invalid live bookings response');
    return rows.map((booking) => {
      const snapshot = booking.venueSnapshot ?? {};
      const latitude = booking.venue?.lat ?? snapshot.lat;
      const longitude = booking.venue?.lng ?? snapshot.lng;
      const located =
        typeof latitude === 'number' &&
        Number.isFinite(latitude) &&
        Math.abs(latitude) <= 90 &&
        typeof longitude === 'number' &&
        Number.isFinite(longitude) &&
        Math.abs(longitude) <= 180;
      return {
        id: booking.id,
        sessionId: booking.bookingRef,
        companionName: booking.companion?.name ?? 'Unassigned',
        userName: booking.customer?.name ?? 'Unknown',
        latitude: located ? latitude : null,
        longitude: located ? longitude : null,
        status: booking.status,
      };
    });
  },
};
