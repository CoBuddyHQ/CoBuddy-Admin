export interface PushNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  targetAudience: 'ALL' | 'CUSTOMERS' | 'COMPANIONS' | 'CITY_SPECIFIC';
  targetCity?: string;
  isPublished: boolean;
  expiresAt?: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'PARTIAL';
  scheduledFor?: string;
  sentAt?: string;
  failureReason?: string;
}

export interface NotificationConfig {
  deliveryConfigured: boolean;
  schedulingEnabled: boolean;
  provider: string;
}
