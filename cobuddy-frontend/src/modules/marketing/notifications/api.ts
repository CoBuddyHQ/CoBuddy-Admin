import axios from '@/lib/api/client';
import { PushNotification, NotificationConfig } from './types';
export const notificationsApi = {
  getNotifications: async (): Promise<PushNotification[]> => {
    return (await axios.get('/marketing/notifications')).data.data;
  },
  createNotification: async (
    notif: Omit<PushNotification, 'id' | 'status' | 'sentAt' | 'failureReason'> & {
      status: 'DRAFT' | 'SCHEDULED';
    },
  ): Promise<void> => {
    await axios.post('/marketing/notifications', {
      ...notif,
      targetCity: notif.targetCity || undefined,
      scheduledFor: notif.scheduledFor ? new Date(notif.scheduledFor).toISOString() : undefined,
    });
  },
  sendNow: async (id: string): Promise<void> => {
    await axios.post('/marketing/notifications/' + encodeURIComponent(id) + '/send');
  },
  getConfig: async (): Promise<NotificationConfig> => {
    return (await axios.get('/marketing/notifications/config')).data.data;
  },
};
