import { NotificationConfig } from './types';

let mockConfig: NotificationConfig = {
  fcmServerKey: 'AIzaSy*******************************',
  apnsKeyId: 'ABCD1234EF',
  apnsTeamId: 'XYZ98765WV',
  apnsTopic: 'com.cobuddy.app',
  smsProvider: 'TWILIO',
  smsApiKey: 'sk_test_***************************',
  enableSmsFallback: true,
};

export const notificationConfigsApi = {
  getConfig: async (): Promise<NotificationConfig> => Promise.resolve({ ...mockConfig }),
  updateConfig: async (config: NotificationConfig): Promise<void> => {
    mockConfig = { ...config };
    return Promise.resolve();
  }
};
