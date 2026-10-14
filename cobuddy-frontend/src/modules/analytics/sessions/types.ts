export interface SessionMetrics {
  totalSessionsToday: number;
  avgDurationMinutes: number | null;
  cancellationRate: number | null;
  statuses: { status: string; count: number }[];
  chartData: {
    hour: string;
    sessions: number;
    cancellations: number;
  }[];
}
