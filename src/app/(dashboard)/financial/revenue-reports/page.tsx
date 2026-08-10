'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useRevenueStats } from '@/modules/financials/revenue/hooks/useRevenueStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, BarChart } from '@tremor/react';
import { useState } from 'react';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToCsv } from '@/lib/exportCsv';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';

export default function RevenueDashboardPage() {
  const { stats, isLoading } = useRevenueStats();
  const { cities } = useMasterData();
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  if (isLoading || !stats) return <div className="p-6">Loading Financial Data...</div>;

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const filteredChartData = stats.chartData.filter(d => {
    if (cityFilter !== 'ALL' && d.city !== cityFilter) return false;
    if (startDate && new Date(d.date) < new Date(startDate)) return false;
    if (endDate && new Date(d.date) > new Date(endDate)) return false;
    return true;
  });

  const handleExport = () => {
    exportToCsv(filteredChartData, `revenue_export_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Platform Revenue Dashboard" 
          description="Monitor Gross Booking Value (GBV), commissions, escrow status, and taxes."
        />
        <div className="flex flex-wrap items-center gap-2 bg-background p-2 border rounded-md">
          <Input type="date" className="w-36 h-8 text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-muted-foreground">-</span>
          <Input type="date" className="w-36 h-8 text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
          
          <Select value={cityFilter} onValueChange={(val: any) => setCityFilter(val)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Cities</SelectItem>
              {cities.map(c => (
                <SelectItem key={c.id} value={c.id}>{getLocalizedText(c.name, 'en')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
            <Download className="w-3 h-3 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Platform Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Net Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-green-600">{formatCurrency(stats.netRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">In Escrow (Held)</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{formatCurrency(stats.escrowBalance)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Payout Liability</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-amber-600">{formatCurrency(stats.payoutLiability)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Available for Payout</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-green-600">{formatCurrency(stats.availableForPayout)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Pending Refunds</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-destructive">{formatCurrency(stats.pendingRefunds)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Refund Ratio</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{stats.refundRatio}%</div></CardContent>
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
              data={filteredChartData}
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
              data={filteredChartData}
              index="date"
              categories={['taxes']}
              colors={['amber']}
              valueFormatter={formatCurrency}
              yAxisWidth={80}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue By City (All Time)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <BarChart
              className="h-full w-full min-h-[300px]"
              data={stats.revenueByCity}
              index="city"
              categories={['gmv', 'commission']}
              colors={['indigo', 'cyan']}
              valueFormatter={formatCurrency}
              yAxisWidth={80}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
