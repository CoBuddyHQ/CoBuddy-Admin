'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useGeofenceAlerts } from '@/modules/safety/geofence/hooks/useGeofenceAlerts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import { useRouter } from 'next/navigation';

export default function GeofencePage() {
  const { alerts, isLoading, updateStatus } = useGeofenceAlerts();
  const router = useRouter();

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Geofence Breach Alerts" 
        description="Monitor instances where a companion deviates significantly from the expected booking location."
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID / Session</TableHeaderCell>
                <TableHeaderCell>Companion</TableHeaderCell>
                <TableHeaderCell>Location Mismatch</TableHeaderCell>
                <TableHeaderCell>Severity</TableHeaderCell>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.id}</div>
                    <div className="text-xs text-muted-foreground">{a.sessionId}</div>
                  </TableCell>
                  <TableCell>{a.companionName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Expected: </span> {a.expectedLocation}
                    </div>
                    <div className="text-sm text-destructive font-medium flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" /> {a.actualLocation}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.breachSeverity === 'HIGH' ? 'destructive' : a.breachSeverity === 'MEDIUM' ? 'default' : 'secondary'}>
                      {a.breachSeverity}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(a.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {a.status !== 'RESOLVED' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                          Update <ChevronDown className="ml-2 h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => updateStatus({ id: a.id, status: 'RESOLVED' })}>Mark Resolved</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus({ id: a.id, status: 'ESCALATED' })} className="text-destructive font-medium">Escalate to SOS</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
