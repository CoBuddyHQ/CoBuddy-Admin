'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useGrowthStats } from '@/modules/analytics/growth/hooks/useGrowthStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart } from '@tremor/react';

export default function GrowthDashboardPage() {
  const { stats, isLoading } = useGrowthStats();

  if (isLoading || !stats) return <div className="p-6">Loading Analytics Data...</div>;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="User Growth & Retention" 
        description="Track user acquisition, companion onboarding, and overall retention metrics."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Registered Users</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">New Users (This Month)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">+{stats.newUsersThisMonth.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Companions</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.activeCompanions.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">30-Day Retention Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.retentionRate}%</div></CardContent>
        </Card>
      </div>

      <Card className="flex-1 min-h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle>Signups vs Active Users</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <AreaChart
            className="h-full w-full min-h-[300px]"
            data={stats.chartData}
            index="date"
            categories={['newSignups', 'activeUsers']}
            colors={['cyan', 'indigo']}
            yAxisWidth={60}
          />
        </CardContent>
      </Card>
    </div>
  );
}
