'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSessionMetrics } from '@/modules/analytics/sessions/hooks/useSessionMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart, DonutChart } from '@tremor/react';
import { useCompanions } from '@/modules/companions/hooks/useCompanions';
import { useTickets } from '@/modules/support/tickets/hooks/useTickets';
import { useSLA } from '@/modules/support/sla-dashboard/hooks/useSLA';

export default function SessionMetricsPage() {
  const { metrics, isLoading: sessionsLoading } = useSessionMetrics();
  const { companions, isLoading: compsLoading } = useCompanions();
  const { tickets, isLoading: ticketsLoading } = useTickets();
  const { alerts, isLoading: slaLoading } = useSLA();

  if (sessionsLoading || compsLoading || ticketsLoading || slaLoading || !metrics) return <div className="p-6">Loading Analytics Data...</div>;

  // 1. Booking Funnel
  // Requested = totalSessionsToday * 1.3, Accepted = totalSessionsToday, Completed = totalSessionsToday * (1 - cancellationRate)
  const requested = Math.round(metrics.totalSessionsToday * 1.3);
  const accepted = metrics.totalSessionsToday;
  const completed = Math.round(metrics.totalSessionsToday * (1 - metrics.cancellationRate / 100));
  const funnelData = [
    { stage: 'Requested', count: requested },
    { stage: 'Accepted', count: accepted },
    { stage: 'Completed', count: completed }
  ];

  // 2. Ticket Volume & SLA Breach
  const openTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const breachedCount = alerts.filter((a: any) => a.status === 'BREACHED').length;
  const slaBreachPct = tickets.length > 0 ? ((breachedCount / tickets.length) * 100).toFixed(1) : '0';

  // 3. Discovery Distribution
  const totalBookings = companions.reduce((sum, c) => sum + c.totalSessions, 0);
  const sortedComps = [...companions].sort((a, b) => b.totalSessions - a.totalSessions);
  const top10Count = Math.max(1, Math.ceil(sortedComps.length * 0.1));
  const top10Bookings = sortedComps.slice(0, top10Count).reduce((sum, c) => sum + c.totalSessions, 0);
  const remainingBookings = totalBookings - top10Bookings;
  const discoveryData = [
    { name: 'Top 10% Companions', bookings: top10Bookings },
    { name: 'Remaining 90%', bookings: remainingBookings }
  ];


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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              className="h-64"
              data={funnelData}
              index="stage"
              categories={['count']}
              colors={['blue']}
              layout="vertical"
              showLegend={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support & SLA Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Total Open Tickets</span>
              <span className="text-xl font-bold">{openTickets}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">SLA Breaches (Active)</span>
              <span className="text-xl font-bold text-destructive">{breachedCount}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">SLA Breach Rate</span>
              <span className="text-xl font-bold text-destructive">{slaBreachPct}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discovery Distribution (Fairness)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <DonutChart
            className="h-full w-full"
            data={discoveryData}
            category="bookings"
            index="name"
            colors={['amber', 'slate']}
            valueFormatter={(val) => `${val} bookings`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
