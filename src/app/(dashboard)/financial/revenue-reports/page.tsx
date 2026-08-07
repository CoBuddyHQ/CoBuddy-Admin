'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useRevenueStats } from '@/modules/financials/revenue/hooks/useRevenueStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, BarChart } from '@tremor/react';

export default function RevenueDashboardPage() {
  const { stats, isLoading } = useRevenueStats();

  if (isLoading || !stats) return <div className="p-6">Loading Financial Data...</div>;

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Platform Revenue Dashboard" 
        description="Monitor Gross Booking Value (GBV), commissions, escrow status, and taxes."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Revenue (YTD)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Escrow (Held)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.escrowBalance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Available for Payout</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(stats.availableForPayout)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Refunds</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(stats.pendingRefunds)}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Gross Booking Value vs Platform Fee</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <AreaChart
              className="h-full w-full min-h-[300px]"
              data={stats.chartData}
              index="date"
              categories={['grossBookingValue', 'platformFee']}
              colors={['indigo', 'cyan']}
              valueFormatter={formatCurrency}
              yAxisWidth={80}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Tax Collection</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <BarChart
              className="h-full w-full min-h-[300px]"
              data={stats.chartData}
              index="date"
              categories={['taxes']}
              colors={['amber']}
              valueFormatter={formatCurrency}
              yAxisWidth={80}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
