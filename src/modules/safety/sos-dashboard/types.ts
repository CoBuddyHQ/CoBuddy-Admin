export interface SosAlert {
  id: string;
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  sessionId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  audioCaptureUrl?: string;
}
