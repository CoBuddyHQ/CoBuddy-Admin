'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEscrow } from '@/modules/financial/escrow/hooks/useEscrow';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Page } from '@/modules/financial/escrow/types';

const money = (amount: string, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(Number(amount));

function Pagination({
  meta,
  page,
  onChange,
  busy,
}: {
  meta?: Page<unknown>['meta'];
  page: number;
  onChange: (page: number) => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 py-3 text-sm">
      <span>
        Page {page} of {Math.max(1, meta?.totalPages ?? 1)} | {meta?.totalItems ?? 0} records
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous page"
        title="Previous page"
        disabled={busy || page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next page"
        title="Next page"
        disabled={busy || !meta?.hasNext}
        onClick={() => onChange(page + 1)}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function EscrowPage() {
  const [escrowPage, setEscrowPage] = useState(1);
  const [walletPage, setWalletPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const { recordsQuery, walletsQuery, releaseMutation } = useEscrow(escrowPage, walletPage);
  const refresh = () => {
    void recordsQuery.refetch();
    void walletsQuery.refetch();
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Escrow & Wallets" />
        <Button
          variant="outline"
          size="icon"
          aria-label="Refresh balances"
          title="Refresh balances"
          onClick={refresh}
          disabled={recordsQuery.isFetching || walletsQuery.isFetching}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <section className="min-w-0 space-y-3">
        <h2 className="text-lg font-semibold">Pending Escrow</h2>
        {recordsQuery.isError ? (
          <p role="alert">Unable to load escrow. Please refresh to retry.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Companion</TableHead>
                <TableHead>Companion Share</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead>Release Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordsQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={8}>Loading escrow...</TableCell>
                </TableRow>
              ) : recordsQuery.data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>No pending escrow.</TableCell>
                </TableRow>
              ) : (
                recordsQuery.data?.data.map((record) => {
                  const due = new Date(record.escrowReleaseAt).getTime() <= now;
                  const canRelease = record.status === 'COMPLETED' && !!record.companion && due;
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.bookingRef}</TableCell>
                      <TableCell>{record.customer.name}</TableCell>
                      <TableCell>{record.companion?.name ?? 'Unassigned'}</TableCell>
                      <TableCell>{money(record.companionNetAmount)}</TableCell>
                      <TableCell>{money(record.platformFeeAmount)}</TableCell>
                      <TableCell>{new Date(record.escrowReleaseAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.status.replaceAll('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canRelease || releaseMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                'Release escrow for ' +
                                  record.bookingRef +
                                  '? Companion: ' +
                                  money(record.companionNetAmount) +
                                  '. Platform: ' +
                                  money(record.platformFeeAmount) +
                                  '.',
                              )
                            )
                              releaseMutation.mutate(record.id);
                          }}
                        >
                          {releaseMutation.isPending && releaseMutation.variables === record.id
                            ? 'Releasing...'
                            : 'Release'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
        <Pagination
          meta={recordsQuery.data?.meta}
          page={escrowPage}
          onChange={setEscrowPage}
          busy={recordsQuery.isFetching || releaseMutation.isPending}
        />
      </section>
      <section className="min-w-0 space-y-3">
        <h2 className="text-lg font-semibold">Wallet Balances</h2>
        {walletsQuery.isError ? (
          <p role="alert">Unable to load wallets. Please refresh to retry.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletsQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading wallets...</TableCell>
                </TableRow>
              ) : walletsQuery.data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No wallets found.</TableCell>
                </TableRow>
              ) : (
                walletsQuery.data?.data.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div className="font-medium">
                        {wallet.customer?.name ?? wallet.companion?.name ?? 'Platform'}
                      </div>
                      <div className="text-xs text-muted-foreground">{wallet.id}</div>
                    </TableCell>
                    <TableCell>{wallet.ownerType}</TableCell>
                    <TableCell>{money(wallet.balance, wallet.currency)}</TableCell>
                    <TableCell>{new Date(wallet.updatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        <Pagination
          meta={walletsQuery.data?.meta}
          page={walletPage}
          onChange={setWalletPage}
          busy={walletsQuery.isFetching}
        />
      </section>
    </div>
  );
}
