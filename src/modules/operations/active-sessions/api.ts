import { ActiveSession } from './types';

const mockSessions: ActiveSession[] = [
  { id: 'ACT-1', sessionId: 'SESS-201', companionName: 'Alice', userName: 'John', startTime: new Date(Date.now() - 3600000).toISOString(), expectedEndTime: new Date(Date.now() + 3600000).toISOString(), status: 'IN_PROGRESS', location: 'Bandra West' },
  { id: 'ACT-2', sessionId: 'SESS-203', companionName: 'Charlie', userName: 'Dave', startTime: new Date(Date.now() - 7200000).toISOString(), expectedEndTime: new Date(Date.now() + 1800000).toISOString(), status: 'EXTENDED', location: 'Andheri East' },
];

export const activeSessionsApi = {
  getSessions: async (): Promise<ActiveSession[]> => Promise.resolve([...mockSessions]),
};
