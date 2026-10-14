'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useGrowthStats } from '@/modules/analytics/growth/hooks/useGrowthStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from '@tremor/react';
import { Button } from '@/components/ui/button';

export default function GrowthDashboardPage() {
  const { stats, isLoading, isError, refetch } = useGrowthStats();

  if (isError)
    return (
      <div role="alert">
        Could not load growth metrics. <Button onClick={() => void refetch()}>Retry</Button>
      </div>
    );

  if (isLoading || !stats) return <div className="">Loading Analytics Data...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Growth" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Customers (Month to Date, UTC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{stats.newUsersThisMonth.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Companions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCompanions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Customers and Completed-Booking Customers (UTC)</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart
            className="h-80 mt-4"
            data={stats.chartData.map((d) => ({
              ...d,
              date: new Date(d.date).toLocaleDateString('en-US', {
                timeZone: 'UTC',
                month: 'short',
                day: 'numeric',
              }),
            }))}
            index="date"
            categories={['newSignups', 'bookingCustomers']}
            colors={['cyan', 'indigo']}
            yAxisWidth={80}
          />
        </CardContent>
      </Card>
    </div>
  );
}
