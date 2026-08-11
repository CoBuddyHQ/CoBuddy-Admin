export interface StaffNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  timestamp: string;
  type: 'sos' | 'ticket' | 'sla' | 'verification';
}
