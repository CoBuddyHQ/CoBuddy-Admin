export interface SosAlert {
  id: string;
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  sessionId: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'UNKNOWN';
  audioCaptureUrl?: string;
  phone: string;
  otherPartyName: string;
  otherPartyType: 'CUSTOMER' | 'COMPANION';
  venue: string;
  activity: string;
}

export type SosStatusUpdate = 'ACKNOWLEDGED' | 'RESOLVED';
