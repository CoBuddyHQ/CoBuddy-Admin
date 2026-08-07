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
