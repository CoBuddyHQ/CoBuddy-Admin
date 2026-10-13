'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, MoreHorizontal, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePayouts } from '@/modules/financial/payouts/hooks/usePayouts';
import type { PayoutAction, PayoutItem, PayoutStatus } from '@/modules/financial/payouts/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statuses: PayoutStatus[] = ['PENDING', 'ON_HOLD', 'PROCESSING', 'PAID', 'FAILED'];
const labels: Record<PayoutAction['action'], string> = {
  process: 'Mark processing',
  hold: 'Place on hold',
  'lift-hold': 'Lift hold',
  'mark-paid': 'Record payment',
  'mark-failed': 'Mark failed',
};
const money = (amount: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount));

export default function PayoutsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PayoutStatus | ''>('');
  const [selection, setSelection] = useState<{
    payout: PayoutItem;
    action: PayoutAction['action'];
  } | null>(null);
  const [value, setValue] = useState('');
  const { query, mutation } = usePayouts(page, status || undefined);
  const needsReason = selection?.action === 'hold' || selection?.action === 'mark-failed';
  const needsReference = selection?.action === 'mark-paid';
  const requiresValue = needsReason || needsReference;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selection || mutation.isPending) return;
    const { payout, action } = selection;
    const input: PayoutAction =
      action === 'hold' || action === 'mark-failed'
        ? { id: payout.id, action, reason: value.trim() }
        : action === 'mark-paid'
          ? { id: payout.id, action, utrNumber: value.trim() }
          : { id: payout.id, action };
    try {
      await mutation.mutateAsync(input);
      setSelection(null);
    } catch {
      // Keep the confirmation open so the operator can correct or retry the request.
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Payout Records" />
        <div className="flex items-center gap-3">
          <select
            aria-label="Payout status"
            className="h-9 max-w-full rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PayoutStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh payouts"
            title="Refresh payouts"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {query.isError ? (
        <p role="alert">Unable to load payouts. Refresh to retry.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {[
                'Payout',
                'Companion',
                'Period',
                'Destination',
                'Amount',
                'Due',
                'Status',
                'Action',
              ].map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending ? (
              <TableRow>
                <TableCell colSpan={8}>Loading payouts...</TableCell>
              </TableRow>
            ) : query.data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No payouts found.</TableCell>
              </TableRow>
            ) : (
              query.data?.data.map((payout) => {
                const actions: PayoutAction['action'][] =
                  payout.status === 'ON_HOLD'
                    ? ['lift-hold']
                    : payout.status === 'PROCESSING'
                      ? ['mark-paid', 'mark-failed']
                      : payout.status === 'PENDING' || payout.status === 'FAILED'
                        ? ['hold', 'process']
                        : [];
                return (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.payoutRef}</TableCell>
                    <TableCell>{payout.companion?.name ?? payout.companionId}</TableCell>
                    <TableCell>
                      {new Date(payout.periodStart).toLocaleDateString()} -{' '}
                      {new Date(payout.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {payout.bankAccount ? (
                        <div className="space-y-1">
                          <div>
                            {payout.bankAccount.upiId ||
                              'A/C ****' + payout.bankAccount.accountLast4}
                          </div>
                          <Badge variant={payout.bankAccount.verified ? 'outline' : 'destructive'}>
                            {payout.bankAccount.verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                      ) : (
                        'Not configured'
                      )}
                    </TableCell>
                    <TableCell>{money(payout.amount)}</TableCell>
                    <TableCell>{new Date(payout.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payout.status === 'FAILED' || payout.status === 'ON_HOLD'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {payout.status.replaceAll('_', ' ')}
                      </Badge>
                      {(payout.holdReason || payout.failureMessage || payout.utrNumber) && (
                        <p className="mt-1 max-w-56 whitespace-normal break-words text-xs text-muted-foreground">
                          {payout.status === 'ON_HOLD'
                            ? payout.holdReason
                            : payout.status === 'FAILED'
                              ? payout.failureMessage
                              : payout.utrNumber}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {actions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={'Actions for ' + payout.payoutRef}
                            title="Payout actions"
                            disabled={mutation.isPending}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {actions.map((action) => (
                              <DropdownMenuItem
                                key={action}
                                disabled={action === 'process' && !payout.bankAccount?.verified}
                                onClick={() => {
                                  mutation.reset();
                                  setSelection({ payout, action });
                                  setValue('');
                                }}
                              >
                                {labels[action]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
        <span>
          Page {page} of {Math.max(1, query.data?.meta.totalPages ?? 1)} |{' '}
          {query.data?.meta.totalItems ?? 0} records
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          title="Previous page"
          disabled={page <= 1 || query.isFetching || mutation.isPending}
          onClick={() => setPage(page - 1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          title="Next page"
          disabled={!query.data?.meta.hasNext || query.isFetching || mutation.isPending}
          onClick={() => setPage(page + 1)}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <Dialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setSelection(null);
        }}
      >
        <DialogContent showCloseButton={!mutation.isPending}>
          <DialogHeader>
            <DialogTitle>{selection ? labels[selection.action] : 'Update payout'}</DialogTitle>
            <DialogDescription>
              {selection &&
                [
                  selection.payout.payoutRef,
                  money(selection.payout.amount),
                  selection.payout.companion?.name ?? selection.payout.companionId,
                ].join(' | ')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {requiresValue && (
              <div className="space-y-2">
                <Label htmlFor="payout-reference">
                  {needsReference ? 'Bank transaction reference (UTR)' : 'Reason'}
                </Label>
                <Input
                  id="payout-reference"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  required
                  minLength={3}
                  maxLength={needsReference ? 128 : 500}
                  disabled={mutation.isPending}
                  autoComplete="off"
                />
              </div>
            )}
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                The payout could not be updated. Check its latest status before retrying.
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setSelection(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || (requiresValue && value.trim().length < 3)}
              >
                {mutation.isPending ? 'Saving...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
