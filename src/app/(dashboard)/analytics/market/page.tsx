'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useMarketPerformance } from '@/modules/analytics/market/hooks/useMarketPerformance';
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

export default function MarketPerformancePage() {
  const { performance, isLoading } = useMarketPerformance();

  if (isLoading) return <div className="p-6">Loading Analytics Data...</div>;

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const chartData = performance.map(p => ({
    name: p.cityName,
    Bookings: p.totalBookings,
    Revenue: p.revenueGenerated
  }));

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Market & City Performance" 
        description="Analyze revenue, bookings, and growth by geographical location."
      />

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
              yAxisWidth={80}
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
