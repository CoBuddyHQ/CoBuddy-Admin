'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useSLA } from '@/modules/support/sla-dashboard/hooks/useSLA';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, UserMinus } from 'lucide-react';

export default function SLADashboardPage() {
  const { alerts, performance, isLoading, reassignTicket } = useSLA();

  if (isLoading) return <div className="">Loading...</div>;

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / 3600000);
    const mins = Math.floor((absMs % 3600000) / 60000);
    return `${isNegative ? '-' : ''}${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Tracking Dashboard"
        description="Monitor support ticket aging, agent performance, and breach alerts."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SLA Breach Alerts</CardTitle>
            <CardDescription>Tickets approaching or exceeding SLA limits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{alert.ticketId}</div>
                    <div className="text-xs text-muted-foreground">Assigned to: {alert.agentName}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={alert.status === 'BREACHED' ? 'destructive' : 'secondary'}>
                      {alert.status === 'BREACHED' ? 'Breached' : 'Warning'}
                    </Badge>
                    <span className={`text-xs font-mono ${alert.timeRemainingMs < 0 ? 'text-destructive' : 'text-amber-500'}`}>
                      {formatTime(alert.timeRemainingMs)}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    title="Reassign to Backup Queue"
                    onClick={() => reassignTicket({ ticketId: alert.ticketId, newAgentName: 'Backup_Queue' })}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No active SLA alerts.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>Average resolution times and breach rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Avg Time</TableHead>
                  <TableHead>Breaches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.map((perf) => (
                  <TableRow key={perf.agentId}>
                    <TableCell className="font-medium">{perf.agentName}</TableCell>
                    <TableCell>{perf.activeTickets}</TableCell>
                    <TableCell>{perf.ticketsResolved}</TableCell>
                    <TableCell>{formatTime(perf.averageResolutionTimeMs)}</TableCell>
                    <TableCell>
                      {perf.slaBreaches > 0 ? (
                        <span className="text-destructive font-medium">{perf.slaBreaches}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

