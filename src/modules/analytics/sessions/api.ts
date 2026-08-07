import { SessionMetrics } from './types';

const mockData: SessionMetrics = {
  totalSessionsToday: 1250,
  avgDurationMinutes: 145,
  cancellationRate: 4.2,
  chartData: [
    { hour: '08:00', sessions: 45, cancellations: 2 },
    { hour: '10:00', sessions: 80, cancellations: 5 },
    { hour: '12:00', sessions: 120, cancellations: 8 },
    { hour: '14:00', sessions: 150, cancellations: 10 },
    { hour: '16:00', sessions: 180, cancellations: 12 },
    { hour: '18:00', sessions: 250, cancellations: 15 },
    { hour: '20:00', sessions: 310, cancellations: 20 },
    { hour: '22:00', sessions: 200, cancellations: 18 },
  ]
};

export const sessionsApi = {
  getMetrics: async (): Promise<SessionMetrics> => Promise.resolve(mockData),
};
