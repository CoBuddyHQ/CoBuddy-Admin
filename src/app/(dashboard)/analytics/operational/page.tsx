'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSessionMetrics } from '@/modules/analytics/sessions/hooks/useSessionMetrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart } from '@tremor/react';

export default function SessionMetricsPage() {
  const { metrics, isLoading, isError, refetch } = useSessionMetrics();
  if (isError)
    return (
      <div role="alert">
        Could not load session metrics. <Button onClick={() => void refetch()}>Retry</Button>
      </div>
    );
  if (isLoading || !metrics) return <div role="status">Loading session metrics...</div>;
  const summaries = [
    { label: 'Bookings Today (UTC)', value: metrics.totalSessionsToday.toLocaleString() },
    {
      label: 'Average Booked Duration',
      value:
        metrics.avgDurationMinutes === null ? 'No bookings' : `${metrics.avgDurationMinutes} mins`,
    },
    {
      label: 'Cancellation Rate',
      value: metrics.cancellationRate === null ? 'No bookings' : `${metrics.cancellationRate}%`,
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Session Metrics" />
      <div className="grid gap-4 md:grid-cols-3">
        {summaries.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-sm">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{item.value}</CardContent>
          </Card>
        ))}
      </div>
      <section className="min-w-0 border-t pt-4">
        <h2 className="text-base font-semibold">Bookings by Scheduled Hour (UTC)</h2>
        <LineChart
          className="mt-4 h-72"
          data={metrics.chartData}
          index="hour"
          categories={['sessions', 'cancellations']}
          colors={['cyan', 'rose']}
          yAxisWidth={60}
        />
      </section>
      <section className="min-w-0 border-t pt-4">
        <h2 className="text-base font-semibold">Current Booking Statuses (Today)</h2>
        {metrics.statuses.length ? (
          <BarChart
            className="mt-4 h-72"
            data={metrics.statuses}
            index="status"
            categories={['count']}
            colors={['emerald']}
            showLegend={false}
          />
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No bookings scheduled today.</p>
        )}
      </section>
    </div>
  );
}
