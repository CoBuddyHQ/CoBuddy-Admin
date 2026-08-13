import { PushNotification, NotificationConfig } from './types';

const mockNotifications: PushNotification[] = [
  { id: 'PN-01', title: 'Weekend Special!', message: 'Get 20% off all bookings this weekend.', category: 'promo', targetAudience: 'CUSTOMERS', status: 'SENT', sentAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'PN-02', title: 'Mumbai Meetup', message: 'Join the companion mixer in Bandra.', category: 'event', targetAudience: 'CITY_SPECIFIC', targetCity: 'Mumbai', status: 'SCHEDULED', scheduledFor: new Date(Date.now() + 86400000).toISOString() },
  { id: 'PN-03', title: 'Wallet Top-up Successful', message: '₹500 has been credited to your wallet.', category: 'wallet', targetAudience: 'CUSTOMERS', status: 'SENT', sentAt: new Date(Date.now() - 3600000).toISOString() },
];

let mockConfig: NotificationConfig = {
  fcmServerKey: 'AIzaSyB...mock...Key',
  apnsKeyId: 'ABCD123456',
  apnsTeamId: 'XYZ9876543',
  apnsTopic: 'com.cobuddy.app',
  enableSmsFallback: true,
  smsProvider: 'TWILIO',
  smsApiKey: 'MOCK_SMS_KEY_NOT_REAL',
};

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
  },

  getConfig: async (): Promise<NotificationConfig> => Promise.resolve({ ...mockConfig }),
  updateConfig: async (config: NotificationConfig): Promise<void> => {
    mockConfig = { ...config };
    return Promise.resolve();
  }
};
