import axios from '@/lib/api/client';
import { ActiveSession } from './types';

export const activeSessionsApi = {
  getSessions: async (): Promise<ActiveSession[]> => {
    const response = await axios.get('/operations/active-sessions');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((booking: any) => ({
      id: booking.id,
      sessionId: booking.bookingRef,
      companionName: booking.companion?.name ?? 'Unassigned',
      userName: booking.customer?.name ?? 'Unknown',
      startTime: booking.startTime,
      expectedEndTime: booking.endTime,
      status: booking.status,
      location: booking.venue?.address ?? '',
    }));
  },
};
