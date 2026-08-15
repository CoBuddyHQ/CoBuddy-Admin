'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useMarketPerformance } from '@/modules/analytics/market/hooks/useMarketPerformance';
import { useRevenueStats } from '@/modules/financial/revenue-reports/hooks/useRevenueStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DonutChart } from '@tremor/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function FinancialAnalyticsPage() {
  const { performance, isLoading: marketLoading } = useMarketPerformance();
  const { stats: revenueStats, isLoading: revLoading } = useRevenueStats();

  if (marketLoading || revLoading || !revenueStats) return <div className="">Loading Analytics Data...</div>;

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const chartData = performance.map(p => ({
    name: p.cityName,
    Bookings: p.totalBookings,
    Revenue: p.revenueGenerated
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Financial Analytics" 
        description="Analyze revenue, customer acquisition cost (CAC), LTV, and market performance."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Average CAC</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(450)}</div><p className="text-xs text-muted-foreground mt-1">-5% from last month</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Average LTV</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(12500)}</div><p className="text-xs text-muted-foreground mt-1">+12% from last month</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(revenueStats.totalRevenue)}</div><p className="text-xs text-muted-foreground mt-1">YTD Gross Revenue</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Escrow Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(revenueStats.escrowBalance)}</div><p className="text-xs text-muted-foreground mt-1">Currently Held</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by City</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              className="h-72 mt-4"
              data={chartData}
              index="name"
              categories={['Revenue']}
              colors={['indigo']}
              valueFormatter={formatCurrency}
              yAxisWidth={110}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <DonutChart
              className="h-72 mt-4"
              data={chartData}
              category="Bookings"
              index="name"
              colors={['indigo', 'cyan', 'amber', 'rose', 'emerald']}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 min-h-[300px]">
        <CardHeader>
          <CardTitle>Detailed City Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>City</TableHeaderCell>
                <TableHeaderCell>Total Bookings</TableHeaderCell>
                <TableHeaderCell>Active Companions</TableHeaderCell>
                <TableHeaderCell>Revenue Generated</TableHeaderCell>
                <TableHeaderCell>MoM Growth</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {performance.map(p => (
                <TableRow key={p.cityName}>
                  <TableCell className="font-medium">{p.cityName}</TableCell>
                  <TableCell>{p.totalBookings.toLocaleString()}</TableCell>
                  <TableCell>{p.activeCompanions}</TableCell>
                  <TableCell>{formatCurrency(p.revenueGenerated)}</TableCell>
                  <TableCell>
                    <span className={p.growthRate >= 0 ? 'text-green-600' : 'text-destructive'}>
                      {p.growthRate > 0 ? '+' : ''}{p.growthRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

