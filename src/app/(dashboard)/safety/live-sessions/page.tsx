'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveSessions } from '@/modules/safety/live-sessions/hooks/useLiveSessions';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function LiveSessionsPage() {
  const { sessions, isLoading, resolveSOS } = useLiveSessions();

  if (isLoading) return <div className="p-6">Loading live sessions...</div>;

  const ongoingSessions = sessions.filter(s => s.status !== 'COMPLETED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Sessions Monitor"
        description="Monitor ongoing bookings and respond immediately to SOS alerts."
      />

      <Card className={ongoingSessions.some(s => s.status === 'SOS_TRIGGERED') ? 'border-destructive' : ''}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Real-time view of currently ongoing companion bookings.</CardDescription>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                {ongoingSessions.length} Active
              </div>
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-4 h-4" />
                {ongoingSessions.filter(s => s.status === 'SOS_TRIGGERED').length} SOS Alerts
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ongoingSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No active sessions right now.
                  </TableCell>
                </TableRow>
              ) : ongoingSessions.map((session) => (
                <TableRow key={session.id} className={session.status === 'SOS_TRIGGERED' ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-mono text-xs">{session.id}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      <Link href={`/companions/${session.companionId}`} className="hover:underline text-primary">
                        {session.companionName}
                      </Link>
                      {' & '}
                      <Link href={`/customers/${session.customerId}`} className="hover:underline text-primary">
                        {session.customerName}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">Booking: {session.bookingId}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={session.venue}>
                    {session.venue}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      {' - '} 
                      {new Date(session.expectedEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.status === 'SOS_TRIGGERED' ? 'destructive' : 'default'} className={session.status === 'SOS_TRIGGERED' ? 'animate-pulse' : ''}>
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {session.status === 'SOS_TRIGGERED' && (
                        <Button size="sm" variant="destructive" onClick={() => resolveSOS(session.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolve SOS
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
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
