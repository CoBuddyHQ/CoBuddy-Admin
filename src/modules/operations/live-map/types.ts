export interface LiveBookingMarker {
  id: string;
  sessionId: string;
  companionName: string;
  userName: string;
  latitude: number;
  longitude: number;
  status: 'ARRIVING' | 'IN_PROGRESS' | 'EXTENDED';
}
