import { LiveSession } from './types';

let mockSessions: LiveSession[] = [
  {
    id: 'LS-1001',
    bookingId: 'B-1001',
    companionId: 'COMP-123',
    customerId: 'CUST-456',
    companionName: 'Neha Gupta',
    customerName: 'Rahul Sharma',
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
    expectedEndTime: new Date(Date.now() + 3600000).toISOString(), // 1 hr from now
    status: 'ONGOING',
    venue: 'Starbucks, CP',
    timerStatus: 'ON_TRACK',
    gpsLocation: { lat: 28.6304, lng: 77.2177 },
    checkInStatus: 'CHECKED_IN'
  },
  {
    id: 'LS-1002',
    bookingId: 'B-1002',
    companionId: 'COMP-890',
    customerId: 'CUST-112',
    companionName: 'Vikram Singh',
    customerName: 'Amit Patel',
    startTime: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    expectedEndTime: new Date(Date.now() + 5400000).toISOString(), // 1.5 hr from now
    status: 'SOS_TRIGGERED',
    venue: 'PVR Director\'s Cut',
    timerStatus: 'RUNNING_LATE',
    gpsLocation: { lat: 28.5413, lng: 77.1556 },
    checkInStatus: 'NOT_YET'
  }
];

export const liveSessionsApi = {
  getLiveSessions: async (): Promise<LiveSession[]> => {
    return [...mockSessions];
  },
  
  resolveSOS: async (id: string): Promise<void> => {
    mockSessions = mockSessions.map(s => s.id === id ? { ...s, status: 'ONGOING' } : s);
  },
  flagSession: async (id: string): Promise<void> => {
    mockSessions = mockSessions.map(s => s.id === id ? { ...s, status: 'SOS_TRIGGERED' } : s);
  }
};
