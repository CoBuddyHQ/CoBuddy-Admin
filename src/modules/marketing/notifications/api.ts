import { PushNotification } from './types';

let mockNotifications: PushNotification[] = [
  { id: 'PN-01', title: 'Weekend Special!', message: 'Get 20% off all bookings this weekend.', targetAudience: 'CUSTOMERS', status: 'SENT', sentAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'PN-02', title: 'Mumbai Meetup', message: 'Join the companion mixer in Bandra.', targetAudience: 'CITY_SPECIFIC', targetCity: 'Mumbai', status: 'SCHEDULED', scheduledFor: new Date(Date.now() + 86400000).toISOString() },
];

export const notificationsApi = {
  getNotifications: async (): Promise<PushNotification[]> => Promise.resolve([...mockNotifications]),
  createNotification: async (notif: Omit<PushNotification, 'id' | 'status' | 'sentAt'> & { status: 'DRAFT' | 'SCHEDULED' }): Promise<void> => {
    mockNotifications.unshift({
      ...notif,
      id: `PN-${Math.floor(Math.random() * 1000)}`,
    });
    return Promise.resolve();
  },
  sendNow: async (id: string): Promise<void> => {
    const n = mockNotifications.find(x => x.id === id);
    if (n) {
      n.status = 'SENT';
      n.sentAt = new Date().toISOString();
    }
    return Promise.resolve();
  }
};
