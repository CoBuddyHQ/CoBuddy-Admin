export interface LiveBookingMarker {
  id: string;
  sessionId: string;
  companionName: string;
  userName: string;
  latitude: number | null;
  longitude: number | null;
  status: 'ARRIVING' | 'IN_PROGRESS' | 'EXTENDED';
}
