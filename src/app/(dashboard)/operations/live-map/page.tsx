'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useLiveMap } from '@/modules/operations/live-map/hooks/useLiveMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

export default function LiveMapPage() {
  const { markers, isLoading } = useLiveMap();

  if (isLoading) return <div className="">Loading Live Map...</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Live Booking Map" 
        description="Real-time map view of all ongoing sessions (heatmaps & pinpoints)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Side: Status Summary */}
        <div className="space-y-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions ({markers.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {markers.map(m => (
                <div key={m.id} className="p-3 border rounded-md flex justify-between items-center bg-card">
                  <div>
                    <div className="font-medium text-sm">{m.sessionId}</div>
                    <div className="text-xs text-muted-foreground">{m.companionName} w/ {m.userName}</div>
                  </div>
                  <Badge variant={m.status === 'EXTENDED' ? 'secondary' : m.status === 'ARRIVING' ? 'outline' : 'default'}>
                    {m.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Map Placeholder */}
        <Card className="lg:col-span-2 flex flex-col h-full min-h-[500px]">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 bg-muted/50 flex items-center justify-center relative overflow-hidden rounded-b-xl border-t">
            <div className="text-center text-muted-foreground z-10 bg-background/80 p-4 rounded-md shadow-sm backdrop-blur-sm">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50 text-primary" />
              <p className="font-medium">Mapbox / Google Maps Integration Required</p>
              <p className="text-sm">Currently showing {markers.length} mock pins.</p>
            </div>
            
            {/* Draw mock pins on map background */}
            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=19.0760,72.8777&zoom=11&size=800x600&sensor=false&style=feature:all|element:labels|visibility:off')] bg-cover bg-center opacity-30 dark:invert"></div>
            
            {markers.map((a, i) => (
              <div 
                key={a.id} 
                className={`absolute p-2 rounded-full cursor-pointer hover:scale-125 transition-transform z-20 ${a.status === 'IN_PROGRESS' ? 'bg-primary' : a.status === 'ARRIVING' ? 'bg-amber-500' : 'bg-purple-500'}`}
                style={{ top: `${40 + (i * 15)}%`, left: `${30 + (i * 20)}%` }}
                title={`${a.companionName} (${a.status})`}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

