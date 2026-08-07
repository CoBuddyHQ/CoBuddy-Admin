'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDisputes } from '@/modules/bookings/disputes/hooks/useDisputes';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

export default function BookingDisputesPage() {
  const { disputes, isLoading, updateStatus } = useDisputes();

  if (isLoading) return <div className="p-6">Loading disputes...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Disputes"
        description="Review and resolve disputes raised by customers or companions."
      />

      <Card>
        <CardHeader>
          <CardTitle>Active & Past Disputes</CardTitle>
          <CardDescription>All booking disputes requiring attention or already resolved.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute ID</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-mono text-xs">{dispute.id}</TableCell>
                  <TableCell className="font-mono text-xs">{dispute.bookingId}</TableCell>
                  <TableCell>
                    <Badge variant={dispute.raisedBy === 'CUSTOMER' ? 'outline' : 'secondary'}>
                      {dispute.raisedBy}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={dispute.reason}>
                    {dispute.reason}
                  </TableCell>
                  <TableCell>{formatCurrency(dispute.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      dispute.status === 'OPEN' ? 'destructive' :
                      dispute.status === 'INVESTIGATING' ? 'default' :
                      'secondary'
                    }>
                      {dispute.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {dispute.status === 'OPEN' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus({ id: dispute.id, status: 'INVESTIGATING' })}>
                          <AlertCircle className="h-4 w-4 mr-1" /> Investigate
                        </Button>
                      )}
                      {(dispute.status === 'OPEN' || dispute.status === 'INVESTIGATING') && (
                        <>
                          <Button size="sm" variant="default" onClick={() => updateStatus({ id: dispute.id, status: 'RESOLVED_REFUND' })}>
                            <RotateCcw className="h-4 w-4 mr-1" /> Refund
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => updateStatus({ id: dispute.id, status: 'RESOLVED_NO_REFUND' })}>
                            <CheckCircle className="h-4 w-4 mr-1" /> No Refund
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
