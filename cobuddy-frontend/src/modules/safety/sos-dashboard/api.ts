import axios from '@/lib/api/client';
import type { SosAlert, SosStatusUpdate } from './types';

interface SosApiAlert {
  id: string;
  userId: string;
  userType: SosAlert['userType'];
  bookingId: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  createdAt: string;
  audioClipUrl: string | null;
  booking?: {
    bookingRef: string;
    customer?: { name: string; phone: string };
    companion?: { name: string; phone: string };
    venue?: { name: string };
    activityLabel?: string;
  } | null;
}

const statuses: Record<string, SosAlert['status']> = {
  TRIGGERED: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  INVESTIGATING: 'INVESTIGATING',
  ESCALATED_AUTHORITIES: 'ESCALATED',
  RESOLVED_FALSE_ALARM: 'RESOLVED',
  RESOLVED_REAL_INCIDENT: 'RESOLVED',
};

export const sosApi = {
  getAlerts: async (): Promise<SosAlert[]> => {
    const response = await axios.get<{ data: SosApiAlert[] }>('/safety/sos', {
      params: { activeOnly: true },
    });
    if (!Array.isArray(response.data.data)) throw new Error('Invalid SOS response');
    return response.data.data.map((item) => {
      const booking = item.booking;
      const user = item.userType === 'COMPANION' ? booking?.companion : booking?.customer;
      const other = item.userType === 'COMPANION' ? booking?.customer : booking?.companion;
      return {
        id: item.id,
        userId: item.userId,
        userName: user?.name ?? item.userId,
        userType: item.userType,
        sessionId: booking?.bookingRef ?? item.bookingId ?? '',
        latitude: item.lat,
        longitude: item.lng,
        timestamp: item.createdAt,
        status: statuses[item.status] ?? 'UNKNOWN',
        audioCaptureUrl: item.audioClipUrl ?? undefined,
        phone: user?.phone ?? '',
        otherPartyName: other?.name ?? '',
        otherPartyType: item.userType === 'COMPANION' ? 'CUSTOMER' : 'COMPANION',
        venue: booking?.venue?.name ?? '',
        activity: booking?.activityLabel ?? '',
      } satisfies SosAlert;
    });
  },
  updateStatus: async (id: string, status: SosStatusUpdate): Promise<void> => {
    await axios.patch('/safety/sos/' + encodeURIComponent(id) + '/status', { status });
  },
};
