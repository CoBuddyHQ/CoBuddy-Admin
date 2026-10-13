'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSafetyAnalytics } from '@/modules/analytics/safety/hooks/useSafetyAnalytics';

export default function AnalyticsSafetyPage() {
  const { metrics, isLoading, isError, refetch } = useSafetyAnalytics();

  if (isLoading) return <div role="status">Loading safety analytics…</div>;

  if (isError || !metrics)
    return (
      <div className="space-y-3" role="alert">
        <p>Safety analytics could not be loaded. Check the connection and try again.</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Analytics"
        description="Monitor platform safety, bans, fraud hits, and age verification escalations."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bans & Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeRestrictions}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Active Restrictions</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Repeat Offenders ({metrics.repeatOffenders}):</span>
              <span className="font-medium text-destructive">
                {metrics.repeatOffenderRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fraud Detection Hits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.fraudHits}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Alerts (All Time)</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Spoof/Fake Selfie:</span>
              <span className="font-medium text-destructive">{metrics.spoofHits} Hits</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Age & Minor Safety Escalations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAgeEscalations}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Escalations</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Resolution Rate:</span>
              <span className="font-medium text-green-600">
                {metrics.ageResolutionRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
