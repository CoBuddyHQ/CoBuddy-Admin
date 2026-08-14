'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBans } from '@/modules/moderation/bans/hooks/useBans';
import { useFraudDetection } from '@/modules/financial/fraud-detection/hooks/useFraudDetection';
import { useAgeEscalation } from '@/modules/safety/age-escalation/hooks/useAgeEscalation';

export default function AnalyticsSafetyPage() {
  const { restrictions, isLoading: bansLoading } = useBans();
  const { alerts: fraudAlerts, isLoading: fraudLoading } = useFraudDetection();
  const { cases: ageEscalations, isLoading: ageLoading } = useAgeEscalation();

  if (bansLoading || fraudLoading || ageLoading) return <div className="">Loading Safety Data...</div>;

  const totalBans = restrictions.length;
  const repeatOffenders = restrictions.filter(r => r.reason.toLowerCase().includes('repeat') || r.reason.toLowerCase().includes('multiple')).length;
  const repeatOffenderRatio = totalBans > 0 ? ((repeatOffenders / totalBans) * 100).toFixed(1) : '0';

  const fraudHits = fraudAlerts.length;
  const fraudSpoof = fraudAlerts.filter((a: any) => a.reason === 'GPS_SPOOFING' || a.reason === 'FAKE_SELFIE').length;

  const totalAgeEscalations = ageEscalations.length;
  const resolvedAgeEscalations = ageEscalations.filter((e: any) => e.status === 'APPROVED' || e.status === 'REJECTED').length;

  return (
    <div className="space-y-6 h-full flex flex-col overflow-auto">
      <PageHeader 
        title="Safety Analytics" 
        description="Monitor platform safety, bans, fraud hits, and age verification escalations."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bans & Restrictions</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBans}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Active Restrictions</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Repeat Offenders:</span>
              <span className="font-medium text-destructive">{repeatOffenderRatio}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fraud Detection Hits</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fraudHits}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Alerts (All Time)</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Spoof/Fake Selfie:</span>
              <span className="font-medium text-destructive">{fraudSpoof} Hits</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Age & Minor Safety Escalations</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgeEscalations}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Escalations</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Resolution Rate:</span>
              <span className="font-medium text-green-600">{totalAgeEscalations > 0 ? ((resolvedAgeEscalations/totalAgeEscalations)*100).toFixed(0) : 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

