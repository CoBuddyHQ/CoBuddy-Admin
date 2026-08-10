'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSessionMetrics } from '@/modules/analytics/sessions/hooks/useSessionMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@tremor/react';

export default function SessionMetricsPage() {
  const { metrics, isLoading } = useSessionMetrics();

  if (isLoading || !metrics) return <div className="p-6">Loading Analytics Data...</div>;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Session Metrics" 
        description="Track booking volumes, duration, and cancellation trends."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions (Today)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.totalSessionsToday.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg. Session Duration</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics.avgDurationMinutes} mins</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cancellation Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{metrics.cancellationRate}%</div></CardContent>
        </Card>
      </div>

      <Card className="flex-1 min-h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle>Session Volume & Cancellations (Hourly)</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <LineChart
            className="h-full w-full min-h-[300px]"
            data={metrics.chartData}
            index="hour"
            categories={['sessions', 'cancellations']}
            colors={['indigo', 'rose']}
            yAxisWidth={40}
          />
        </CardContent>
      </Card>
    </div>
  );
}
