'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useGrowthAbuse } from '@/modules/operations/growth-abuse/hooks/useGrowthAbuse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Ban, UserX } from 'lucide-react';

export default function GrowthAbusePage() {
  const { alerts, isLoading, updateStatus, takeAction } = useGrowthAbuse();

  if (isLoading) return <div className="">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referral & Growth Abuse"
        description="Monitor and prevent bot signups, referral farming, and anomalous platform growth."
      />

      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
          <CardDescription>System flagged anomalies requiring moderation review.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium text-xs font-mono">{alert.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'destructive' : 'default'}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{alert.targetName}</div>
                    <div className="text-xs text-muted-foreground">{alert.targetId}</div>
                  </TableCell>
                  <TableCell className="min-w-[300px] max-w-md whitespace-normal">
                    <p className="text-sm">{alert.details}</p>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(alert.timestamp).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      alert.status === 'ACTIONED' || alert.status === 'RESOLVED' ? 'default' : 
                      alert.status === 'INVESTIGATING' ? 'secondary' : 'outline'
                    }>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {alert.status !== 'ACTIONED' && alert.status !== 'RESOLVED' && (
                        <>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => takeAction({ id: alert.id, action: 'BAN_ACCOUNTS' })}
                            title="Ban Associated Accounts"
                          >
                            <Ban className="h-4 w-4 mr-1" /> Ban
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => takeAction({ id: alert.id, action: 'BLOCK_REFERRAL' })}
                            title="Block Referral Chain"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatus({ id: alert.id, status: 'RESOLVED' })}
                          >
                            Clear
                          </Button>
                        </>
                      )}
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

