'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useMarketPerformance } from '@/modules/analytics/market/hooks/useMarketPerformance';
import { Button } from '@/components/ui/button';
import { BarChart } from '@tremor/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

export default function FinancialAnalyticsPage() {
  const { performance, isLoading, isError, refetch } = useMarketPerformance();
  if (isError)
    return (
      <div role="alert">
        Could not load city metrics. <Button onClick={() => void refetch()}>Retry</Button>
      </div>
    );
  if (isLoading) return <div role="status">Loading city metrics...</div>;
  return (
    <div className="space-y-6">
      <PageHeader title="Financial Analytics" />
      <section className="min-w-0">
        <h2 className="text-base font-semibold">Platform Fees on Completed, Paid Bookings</h2>
        {performance.length ? (
          <BarChart
            className="mt-4 h-72"
            data={performance}
            index="cityName"
            categories={['revenueGenerated']}
            colors={['emerald']}
            valueFormatter={(value) => formatCurrency(value)}
            yAxisWidth={100}
            showLegend={false}
          />
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No cities configured.</p>
        )}
      </section>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>City</TableHead>
            <TableHead>All Bookings</TableHead>
            <TableHead>Active Companions</TableHead>
            <TableHead>Completed Booking Fees</TableHead>
            <TableHead>Booking Growth: MTD vs Last Month (UTC)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {performance.map((item) => (
            <TableRow key={item.cityId}>
              <TableCell>{item.cityName}</TableCell>
              <TableCell>{item.totalBookings.toLocaleString()}</TableCell>
              <TableCell>{item.activeCompanions}</TableCell>
              <TableCell>{formatCurrency(item.revenueGenerated)}</TableCell>
              <TableCell>
                {item.growthRate === null ? 'No prior bookings' : `${item.growthRate}%`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
