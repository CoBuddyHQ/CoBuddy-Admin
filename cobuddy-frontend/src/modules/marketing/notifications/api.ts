import axios from '@/lib/api/client';
import { PushNotification, NotificationConfig } from './types';
export const notificationsApi = {
  getNotifications: async (): Promise<PushNotification[]> => {
    return (await axios.get('/marketing/announcements')).data.data;
  },
  createNotification: async (
    notif: Omit<PushNotification, 'id' | 'status' | 'sentAt' | 'failureReason' | 'isPublished'> & {
      status: 'DRAFT' | 'SCHEDULED';
    },
  ): Promise<void> => {
    await axios.post('/marketing/announcements', {
      ...notif,
      targetCity: notif.targetCity || undefined,
      scheduledFor: notif.scheduledFor ? new Date(notif.scheduledFor).toISOString() : undefined,
      expiresAt: notif.expiresAt ? new Date(notif.expiresAt).toISOString() : notif.expiresAt,
    });
  },
  updateAnnouncement: async (
    id: string,
    announcement: Pick<PushNotification, 'title' | 'message' | 'category' | 'targetAudience'> & {
      targetCity?: string;
      expiresAt?: string | null;
    },
  ): Promise<void> => {
    await axios.put('/marketing/announcements/' + encodeURIComponent(id), {
      ...announcement,
      targetCity: announcement.targetCity || undefined,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString() : announcement.expiresAt,
    });
  },
  setPublished: async (id: string, isPublished: boolean): Promise<void> => {
    const action = isPublished ? 'publish' : 'unpublish';
    await axios.post('/marketing/announcements/' + encodeURIComponent(id) + '/' + action);
  },
  sendNow: async (id: string): Promise<void> => {
    await axios.post('/marketing/notifications/' + encodeURIComponent(id) + '/send');
  },
  getConfig: async (): Promise<NotificationConfig> => {
    return (await axios.get('/marketing/notifications/config')).data.data;
  },
};
