export interface ActiveSession {
  id: string;
  sessionId: string;
  companionName: string;
  userName: string;
  startTime: string;
  expectedEndTime: string;
  status: 'ARRIVING' | 'IN_PROGRESS' | 'EXTENDED';
  location: string;
}
