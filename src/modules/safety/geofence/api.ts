import { GeofenceAlert } from './types';

const mockAlerts: GeofenceAlert[] = [
  { id: 'GEO-001', sessionId: 'SESS-202', companionId: 'CompX', companionName: 'Sarah', expectedLocation: 'Starbucks, CP', actualLocation: '2 km away', breachSeverity: 'MEDIUM', timestamp: new Date().toISOString(), status: 'INVESTIGATING' }
];

export const geofenceApi = {
  getAlerts: async (): Promise<GeofenceAlert[]> => Promise.resolve([...mockAlerts]),
  updateStatus: async (id: string, status: GeofenceAlert['status']): Promise<void> => {
    const alert = mockAlerts.find(a => a.id === id);
    if (alert) alert.status = status;
    return Promise.resolve();
  }
};
