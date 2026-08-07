'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDisputes } from '@/modules/bookings/disputes/hooks/useDisputes';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, RotateCcw, PenTool } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BookingDisputesPage() {
  const { disputes, isLoading, updateStatus, overridePenalty } = useDisputes();
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [penalty, setPenalty] = useState('');
  const [reason, setReason] = useState('');

  if (isLoading) return <div className="p-6">Loading disputes...</div>;

  const handleOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (overrideId && penalty && reason) {
      overridePenalty({ id: overrideId, penalty: Number(penalty), reason });
      setOverrideId(null);
      setPenalty('');
      setReason('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Disputes"
        description="Review cancellation disputes, override calculated penalties, or escalate cases."
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
                <TableHead>Notice</TableHead>
                <TableHead>Penalty</TableHead>
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
                  <TableCell>{dispute.noticeGivenHours}h</TableCell>
                  <TableCell>{dispute.calculatedPenaltyPercent}%</TableCell>
                  <TableCell>{formatCurrency(dispute.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      dispute.status === 'OPEN' ? 'destructive' :
                      dispute.status === 'INVESTIGATING' ? 'default' :
                      dispute.status === 'ESCALATED' ? 'destructive' :
                      'secondary'
                    }>
                      {dispute.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {(dispute.status === 'OPEN' || dispute.status === 'INVESTIGATING') && (
                        <>
                          <Button size="sm" variant="default" onClick={() => updateStatus({ id: dispute.id, status: 'RESOLVED_REFUND' })}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Dialog open={overrideId === dispute.id} onOpenChange={(open) => !open && setOverrideId(null)}>
                            <DialogTrigger render={
                              <Button size="sm" variant="secondary" onClick={() => setOverrideId(dispute.id)}>
                                <PenTool className="h-4 w-4 mr-1" /> Override
                              </Button>
                            } />
                            <DialogContent>
                              <DialogHeader><DialogTitle>Override Penalty</DialogTitle></DialogHeader>
                              <form onSubmit={handleOverride} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label>New Penalty Percentage (0-100)</Label>
                                  <Input type="number" min="0" max="100" value={penalty} onChange={e => setPenalty(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                  <Label>Override Reason</Label>
                                  <Input placeholder="Why are you overriding the calculated penalty?" value={reason} onChange={e => setReason(e.target.value)} required />
                                </div>
                                <div className="flex justify-end pt-4">
                                  <Button type="submit">Submit Override</Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus({ id: dispute.id, status: 'ESCALATED' })}>
                            <AlertCircle className="h-4 w-4 mr-1" /> Escalate
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
