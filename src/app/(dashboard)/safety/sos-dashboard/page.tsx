'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSosAlerts } from '@/modules/safety/sos-dashboard/hooks/useSosAlerts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Siren, MapPin, Phone, Volume2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function SosDashboardPage() {
  const { alerts, isLoading, updateStatus } = useSosAlerts();
  const router = useRouter();
  const [selectedMapAlert, setSelectedMapAlert] = useState<any>(null);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string | null>(null);
  const [selectedContactAlert, setSelectedContactAlert] = useState<any>(null);

  if (isLoading) return <div className="">Loading Live SOS Dashboard...</div>;

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED');

  return (
    <div className="space-y-6 h-full flex flex-col bg-red-50/30 dark:bg-red-950/10">
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
                      <CardDescription>
                        Session ID: {alert.sessionId} | Time: {new Date(alert.timestamp).toLocaleTimeString()}
                        <div className="mt-1 text-xs">
                          {alert.otherPartyName && `With: ${alert.otherPartyName} (${alert.otherPartyType}) | `}
                          {alert.venue && `${alert.venue} | `}
                          {alert.activity && `Activity: ${alert.activity}`}
                        </div>
                      </CardDescription>
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
                    <Button variant="outline" className="gap-2" onClick={() => setSelectedContactAlert(alert)}>
                      <Phone className="h-4 w-4" /> Contact
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setSelectedMapAlert(alert)}>
                      <MapPin className="h-4 w-4" /> View Map
                    </Button>
                    {alert.audioCaptureUrl && (
                      <Button variant="secondary" className="gap-2" onClick={() => setSelectedAudioUrl(alert.audioCaptureUrl || null)}>
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

      <Dialog open={selectedMapAlert !== null} onOpenChange={(open) => !open && setSelectedMapAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Live Location: {selectedMapAlert?.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 text-sm">
            <p><strong>Coordinates:</strong> {selectedMapAlert?.location?.lat ?? selectedMapAlert?.latitude}, {selectedMapAlert?.location?.lng ?? selectedMapAlert?.longitude}</p>
            <div className="h-[200px] bg-muted flex items-center justify-center border rounded-md">
              <MapPin className="h-8 w-8 text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Map placeholder</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedAudioUrl !== null} onOpenChange={(open) => !open && setSelectedAudioUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Live Audio Stream</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 flex flex-col items-center">
            {selectedAudioUrl && (
              <audio controls src={selectedAudioUrl} className="w-full" autoPlay>
                Your browser does not support the audio element.
              </audio>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Note: This plays the mock URL capture stream.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedContactAlert !== null} onOpenChange={(open) => !open && setSelectedContactAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p><strong>Name:</strong> {selectedContactAlert?.userName}</p>
            <p><strong>Phone:</strong> {selectedContactAlert?.phone}</p>
            <div className="flex gap-4">
              <Button onClick={() => window.open(`tel:${selectedContactAlert?.phone}`)}>
                Call User
              </Button>
              <Button variant="outline" onClick={() => window.open(`sms:${selectedContactAlert?.phone}`)}>
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

