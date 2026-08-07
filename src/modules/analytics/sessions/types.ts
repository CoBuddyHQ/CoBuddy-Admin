export interface SessionMetrics {
  totalSessionsToday: number;
  avgDurationMinutes: number;
  cancellationRate: number; // percentage
  chartData: {
    hour: string;
    sessions: number;
    cancellations: number;
  }[];
}
