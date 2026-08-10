import { SosAlert } from './types';

const mockAlerts: SosAlert[] = [
  { id: 'SOS-991', userId: 'CompA', userName: 'Alice', userType: 'COMPANION', sessionId: 'SESS-100', latitude: 19.0760, longitude: 72.8777, timestamp: new Date().toISOString(), status: 'ACTIVE', audioCaptureUrl: 'https://example.com/audio1.mp3', phone: '+1234567890', otherPartyName: 'Charlie', otherPartyType: 'CUSTOMER', venue: 'Central Park Cafe', activity: 'Coffee Meet' },
  { id: 'SOS-992', userId: 'UserB', userName: 'Bob', userType: 'CUSTOMER', sessionId: 'SESS-101', latitude: 28.7041, longitude: 77.1025, timestamp: new Date(Date.now() - 300000).toISOString(), status: 'ACKNOWLEDGED', phone: '+0987654321', otherPartyName: 'Diana', otherPartyType: 'COMPANION', venue: 'Downtown Mall', activity: 'Shopping' },
];

export const sosApi = {
  getAlerts: async (): Promise<SosAlert[]> => Promise.resolve([...mockAlerts]),
  updateStatus: async (id: string, status: SosAlert['status']): Promise<void> => {
    const alert = mockAlerts.find(a => a.id === id);
    if (alert) alert.status = status;
    return Promise.resolve();
  }
};
