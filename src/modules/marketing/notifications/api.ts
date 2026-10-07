import { unavailableFeature } from '@/lib/unavailable-feature';
import { PushNotification, NotificationConfig } from './types';
export const notificationsApi = {
  getNotifications: async (): Promise<PushNotification[]> => {
    return unavailableFeature('marketing/notifications');
  },
  createNotification: async (
    _notif: Omit<PushNotification, 'id' | 'status' | 'sentAt'> & {
      status: 'DRAFT' | 'SCHEDULED';
    },
  ): Promise<void> => {
    return unavailableFeature('marketing/notifications');
  },
  sendNow: async (_id: string): Promise<void> => {
    return unavailableFeature('marketing/notifications');
  },
  getConfig: async (): Promise<NotificationConfig> => {
    return unavailableFeature('marketing/notifications');
  },
  updateConfig: async (_config: NotificationConfig): Promise<void> => {
    return unavailableFeature('marketing/notifications');
  },
};
