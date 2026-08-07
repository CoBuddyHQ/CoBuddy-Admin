export interface PushNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | 'CUSTOMERS' | 'COMPANIONS' | 'CITY_SPECIFIC';
  targetCity?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
  scheduledFor?: string;
  sentAt?: string;
}

export interface NotificationConfig {
  fcmServerKey: string;
  apnsKeyId: string;
  apnsTeamId: string;
  apnsTopic: string;
  enableSmsFallback: boolean;
  smsProvider: 'TWILIO' | 'MSG91' | 'AWS_SNS';
  smsApiKey: string;
}
