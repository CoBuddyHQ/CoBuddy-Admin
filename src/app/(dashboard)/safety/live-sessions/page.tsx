'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveSessions } from '@/modules/safety/live-sessions/hooks/useLiveSessions';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LiveSessionsPage() {
  const { sessions, isLoading, flagSession, conflictingSessionIds } = useLiveSessions();

  if (isLoading) return <div className="p-6">Loading live sessions...</div>;

  const activeSessions = sessions.filter(s => s.status !== 'COMPLETED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Sessions Monitor"
        description="Monitor ongoing bookings, check-ins, and handle SOS alerts."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Active SOS</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {sessions.filter(s => s.status === 'SOS_TRIGGERED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Companion</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Venue & GPS</TableHead>
                <TableHead>Time Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timer & Check-In</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No active sessions right now.
                  </TableCell>
                </TableRow>
              ) : activeSessions.map((session) => (
                <TableRow key={session.id} className={cn(session.status === 'SOS_TRIGGERED' && "bg-destructive/10")}>
                  <TableCell>
                    <div className="font-mono text-xs">{session.id}</div>
                    {conflictingSessionIds.has(session.id) && (
                      <Badge variant="destructive" className="mt-1 text-[10px]">
                        OVERLAP CONFLICT
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{session.companionName}</TableCell>
                  <TableCell>{session.customerName}</TableCell>
                  <TableCell>
                    <div className="text-sm">{session.venue}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {session.gpsLocation.lat.toFixed(4)}, {session.gpsLocation.lng.toFixed(4)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">Start: {new Date(session.startTime).toLocaleTimeString()}</div>
                    <div className="text-xs">End: {new Date(session.expectedEndTime).toLocaleTimeString()}</div>
                  </TableCell>
                  <TableCell>
                    {session.status === 'SOS_TRIGGERED' ? (
                      <Badge variant="destructive" className="animate-pulse">SOS TRIGGERED</Badge>
                    ) : (
                      <Badge variant="secondary">ONGOING</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={session.timerStatus === 'ON_TRACK' ? 'outline' : session.timerStatus === 'RUNNING_LATE' ? 'secondary' : 'destructive'} className="w-max text-[10px]">
                        Timer: {session.timerStatus.replace('_', ' ')}
                      </Badge>
                      <Badge variant={session.checkInStatus === 'CHECKED_IN' ? 'default' : session.checkInStatus === 'NOT_YET' ? 'outline' : 'destructive'} className="w-max text-[10px]">
                        Check-in: {session.checkInStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-destructive"
                      onClick={() => flagSession(session.id)}
                      disabled={session.status === 'SOS_TRIGGERED'}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" /> Flag to Ops
                    </Button>
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
