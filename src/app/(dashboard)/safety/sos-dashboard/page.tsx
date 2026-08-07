'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSosAlerts } from '@/modules/safety/sos-dashboard/hooks/useSosAlerts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Siren, MapPin, Phone, Volume2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SosDashboardPage() {
  const { alerts, isLoading, updateStatus } = useSosAlerts();
  const router = useRouter();

  if (isLoading) return <div className="p-6">Loading Live SOS Dashboard...</div>;

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED');

  return (
    <div className="p-6 space-y-6 h-full flex flex-col bg-red-50/30 dark:bg-red-950/10">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Live SOS Dashboard" 
          description="Real-time emergency monitoring. Active SOS alerts appear here instantly."
        />
        {activeAlerts.length > 0 && (
          <div className="flex items-center gap-2 animate-pulse text-destructive font-bold">
            <Siren className="h-6 w-6" /> {activeAlerts.length} ACTIVE EMERGENCY
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* Left Side: Alert List */}
        <div className="space-y-4 overflow-y-auto">
          {activeAlerts.length === 0 ? (
            <Card className="h-full flex items-center justify-center text-muted-foreground">
              No active SOS alerts.
            </Card>
          ) : (
            activeAlerts.map(alert => (
              <Card key={alert.id} className={`border-l-4 ${alert.status === 'ACTIVE' ? 'border-l-destructive shadow-red-500/20 shadow-lg' : 'border-l-amber-500'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-destructive flex items-center gap-2">
                        {alert.userName} ({alert.userType})
                        <Badge variant={alert.status === 'ACTIVE' ? 'destructive' : 'secondary'}>{alert.status}</Badge>
                      </CardTitle>
                      <CardDescription>Session ID: {alert.sessionId} | Time: {new Date(alert.timestamp).toLocaleTimeString()}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {alert.status === 'ACTIVE' && (
                      <Button variant="default" onClick={() => updateStatus({ id: alert.id, status: 'ACKNOWLEDGED' })}>
                        Acknowledge
                      </Button>
                    )}
                    <Button variant="outline" className="gap-2">
                      <MapPin className="h-4 w-4" /> View Map
                    </Button>
                    {alert.audioCaptureUrl && (
                      <Button variant="secondary" className="gap-2">
                        <Volume2 className="h-4 w-4" /> Listen Live
                      </Button>
                    )}
                    <Button variant="outline" className="gap-2" onClick={() => router.push('/safety/emergency-workflow')}>
                      <Phone className="h-4 w-4" /> Emergency Workflow
                    </Button>
                    <div className="flex-1 text-right">
                      <Button variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus({ id: alert.id, status: 'RESOLVED' })}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Resolved
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right Side: Map Placeholder */}
        <Card className="flex flex-col h-full min-h-[400px]">
          <CardHeader>
            <CardTitle>Live Map</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 bg-muted/50 flex items-center justify-center relative">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Map Integration Space</p>
              <p className="text-sm">(Google Maps / Mapbox)</p>
            </div>
            
            {/* Draw mock pins */}
            {activeAlerts.map((a, i) => (
              <div 
                key={a.id} 
                className={`absolute p-2 rounded-full ${a.status === 'ACTIVE' ? 'bg-destructive animate-ping' : 'bg-amber-500'}`}
                style={{ top: `${30 + (i * 20)}%`, left: `${40 + (i * 10)}%` }}
                title={a.userName}
              />
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
