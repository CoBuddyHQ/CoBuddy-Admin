'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDisputes } from '@/modules/bookings/disputes/hooks/useDisputes';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, PenTool } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { BookingDispute } from '@/modules/bookings/disputes/types';

export default function BookingDisputesPage() {
  const {
    disputes,
    isLoading: disputesLoading,
    isError,
    refetch,
    isPending,
    updateStatus,
    overridePenalty,
  } = useDisputes();
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [penalty, setPenalty] = useState('');
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<{
    dispute: BookingDispute;
    status: 'REFUND_PENDING' | 'RESOLVED_NO_REFUND' | 'ESCALATED';
  } | null>(null);
  const [note, setNote] = useState('');

  if (disputesLoading) return <div>Loading disputes...</div>;
  if (isError)
    return (
      <div role="alert">
        Could not load disputes. <Button onClick={() => void refetch()}>Retry</Button>
      </div>
    );

  const handleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const dispute = disputes.find((item) => item.id === overrideId);
    if (dispute && penalty && reason.trim()) {
      try {
        await overridePenalty({
          id: dispute.id,
          version: dispute.version,
          penalty: Number(penalty),
          reason,
        });
        setOverrideId(null);
        setPenalty('');
        setReason('');
      } catch {
        /* The mutation displays the error and leaves the form intact. */
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Booking Disputes" />

      <Card>
        <CardHeader>
          <CardTitle>Active & Past Disputes</CardTitle>
          <CardDescription>
            All booking disputes requiring attention or already resolved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute ID</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Refund %</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Booking Amount</TableHead>
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
                  <TableCell className="max-w-xs truncate" title={dispute.reasonDetails}>
                    <div className="font-medium text-sm">{dispute.reasonCode}</div>
                    {dispute.reasonDetails && (
                      <div className="text-xs text-muted-foreground truncate">
                        {dispute.reasonDetails}
                      </div>
                    )}
                  </TableCell>
                  <TableCell title={dispute.overrideReason}>
                    {dispute.refundPercent === null ? 'Not set' : `${dispute.refundPercent}%`}
                  </TableCell>
                  <TableCell>
                    {dispute.refundAmount === null
                      ? 'Not set'
                      : formatCurrency(dispute.refundAmount)}
                  </TableCell>
                  <TableCell>{formatCurrency(dispute.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        dispute.status === 'OPEN'
                          ? 'destructive'
                          : dispute.status === 'INVESTIGATING'
                            ? 'default'
                            : dispute.status === 'ESCALATED'
                              ? 'destructive'
                              : 'secondary'
                      }
                    >
                      {dispute.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {['OPEN', 'INVESTIGATING', 'ESCALATED'].includes(dispute.status) && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={
                              isPending || dispute.refundPercent === null || !dispute.refundAmount
                            }
                            onClick={() => setAction({ dispute, status: 'REFUND_PENDING' })}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Request Refund
                          </Button>
                          <Dialog
                            open={overrideId === dispute.id}
                            onOpenChange={(open) => !open && !isPending && setOverrideId(null)}
                          >
                            <DialogTrigger
                              render={
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={isPending}
                                  onClick={() => {
                                    setOverrideId(dispute.id);
                                    setPenalty(dispute.refundPercent?.toString() ?? '');
                                    setReason(dispute.overrideReason ?? '');
                                  }}
                                >
                                  <PenTool className="h-4 w-4 mr-1" /> Set Refund
                                </Button>
                              }
                            />
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Set Refund Amount</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleOverride} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="refund-percent">Refund Percentage (0-100)</Label>
                                  <Input
                                    id="refund-percent"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={penalty}
                                    onChange={(e) => setPenalty(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="refund-reason">Reason</Label>
                                  <Input
                                    id="refund-reason"
                                    maxLength={2000}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="flex justify-end pt-4">
                                  <Button type="submit" disabled={isPending || !reason.trim()}>
                                    Save Refund Amount
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            disabled={isPending || dispute.status === 'ESCALATED'}
                            onClick={() => setAction({ dispute, status: 'ESCALATED' })}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" /> Escalate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => setAction({ dispute, status: 'RESOLVED_NO_REFUND' })}
                          >
                            Close Without Refund
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {disputes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>No disputes found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {action && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !isPending) {
              setAction(null);
              setNote('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action?.status === 'REFUND_PENDING'
                  ? 'Request Finance Review'
                  : action?.status === 'ESCALATED'
                    ? 'Escalate Dispute'
                    : 'Close Without Refund'}
              </DialogTitle>
            </DialogHeader>
            {action?.status === 'REFUND_PENDING' && (
              <p>
                Request a wallet refund of {formatCurrency(action.dispute.refundAmount ?? 0)} for{' '}
                {action.dispute.bookingId}?
              </p>
            )}
            <Label htmlFor="resolution-note">
              Resolution Note{' '}
              {action?.status === 'RESOLVED_NO_REFUND' ? '(required)' : '(optional)'}
            </Label>
            <Input
              id="resolution-note"
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              disabled={isPending || (action?.status === 'RESOLVED_NO_REFUND' && !note.trim())}
              onClick={async () => {
                if (!action) return;
                try {
                  await updateStatus({
                    id: action.dispute.id,
                    version: action.dispute.version,
                    status: action.status,
                    note: note.trim() || undefined,
                  });
                  setAction(null);
                  setNote('');
                } catch {
                  /* Keep the confirmation open on a failed request. */
                }
              }}
            >
              {isPending ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
