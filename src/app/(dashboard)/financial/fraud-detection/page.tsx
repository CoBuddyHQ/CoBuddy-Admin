'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useFraudDetection } from '@/modules/financial/fraud-detection/hooks/useFraudDetection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function FraudDetectionPage() {
  const { alerts, isLoading, updateStatus } = useFraudDetection();

  if (isLoading) return <div className="">Loading...</div>;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud Detection Center"
        description="Monitor duplicate accounts, GPS spoofing, fake selfies, and suspicious transactions."
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Fraud Alerts</CardTitle>
          <CardDescription>Review and action system-flagged fraud alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{alert.userName}</div>
                    <div className="text-xs text-muted-foreground">{alert.userId}</div>
                    <Badge variant={alert.userType === 'COMPANION' ? 'default' : 'secondary'} className="mt-1">
                      {alert.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{alert.reason.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={alert.details}>
                    {alert.details}
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'PENDING' ? 'outline' : alert.status === 'FROZEN' ? 'destructive' : 'default'}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {alert.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateStatus({ id: alert.id, status: 'FROZEN' })}
                        >
                          Freeze
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus({ id: alert.id, status: 'CLEARED' })}
                        >
                          Clear
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => updateStatus({ id: alert.id, status: 'ESCALATED' })}
                        >
                          Escalate
                        </Button>
                      </div>
                    )}
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

