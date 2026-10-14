import axios from '@/lib/api/client';
import { GeofenceAlert } from './types';

export const geofenceApi = {
  getAlerts: async (): Promise<GeofenceAlert[]> => {
    const response = await axios.get('/safety/geofence/alerts');
    const rows = response.data.data?.data ?? response.data.data ?? [];
    return rows.map((item: any) => ({
      id: item.id,
      sessionId: item.sessionId,
      companionId: item.companionId,
      companionName: item.companionName,
      expectedLocation: item.expectedLocation,
      actualLocation: item.actualLocation,
      breachSeverity: item.breachSeverity,
      timestamp: item.createdAt,
      status: item.status,
    }));
  },
  updateStatus: async (id: string, status: GeofenceAlert['status']): Promise<void> => {
    await axios.patch('/safety/geofence/alerts/' + id + '/status', { status });
  },
};
