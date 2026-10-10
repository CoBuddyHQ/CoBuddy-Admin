import axios from '@/lib/api/client';
import { LiveSession } from './types';

export const liveSessionsApi = {
  getLiveSessions: async (): Promise<LiveSession[]> => {
    const response = await axios.get('/safety/live-sessions');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    const now = Date.now();
    return rows.map((booking: any) => {
      const end = new Date(booking.endTime).getTime();
      const location = booking.venueSnapshot ?? {};
      return {
        id: booking.id,
        bookingId: booking.bookingRef,
        companionId: booking.companionId ?? '',
        customerId: booking.customerId,
        companionName: booking.companion?.name ?? 'Unassigned',
        customerName: booking.customer?.name ?? 'Unknown',
        startTime: booking.startTime,
        expectedEndTime: booking.endTime,
        status: booking.sosTriggered ? 'SOS_TRIGGERED' : 'ONGOING',
        venue: booking.venue?.name ?? location.name ?? '',
        timerStatus:
          now > end ? 'OVERDUE' : end - now < 30 * 60 * 1000 ? 'RUNNING_LATE' : 'ON_TRACK',
        gpsLocation: {
          lat: booking.venue?.lat ?? location.lat ?? 0,
          lng: booking.venue?.lng ?? location.lng ?? 0,
        },
        checkInStatus: 'CHECKED_IN',
      };
    });
  },

  resolveSOS: async (id: string): Promise<void> => {
    await axios.post('/safety/live-sessions/' + id + '/resolve-sos');
  },

  flagSession: async (id: string): Promise<void> => {
    await axios.post('/safety/live-sessions/' + id + '/safety-check');
  },
};
