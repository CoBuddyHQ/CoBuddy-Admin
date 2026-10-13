'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useReconciliation } from '@/modules/financial/reconciliation/hooks/useReconciliation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReconciliationPage() {
  const { records, isLoading, updateStatus } = useReconciliation();

  if (isLoading) return <div className="">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Gateway Reconciliation"
        description="Monitor internal ledger records against Razorpay settlements and handle mismatches."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Ledger</CardTitle>
          <CardDescription>Resolve failed webhooks and amount mismatches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gateway Transaction ID</TableHead>
                <TableHead>Internal TXN</TableHead>
                <TableHead>Internal Amount</TableHead>
                <TableHead>Gateway Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mismatch Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium text-xs font-mono">
                    {record.gatewayTxnId || record.id}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{record.internalTxnId || '-'}</TableCell>
                  <TableCell>₹{record.amount.toLocaleString()}</TableCell>
                  <TableCell>₹{(record.gatewayAmount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.matchStatus === 'MATCHED'
                          ? 'default'
                          : record.matchStatus === 'MISMATCHED'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {record.matchStatus}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-xs truncate text-xs text-muted-foreground"
                    title={record.mismatchNote}
                  >
                    {record.mismatchNote || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {record.matchStatus === 'MISMATCHED' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateStatus({ id: record.id, status: 'MATCHED' })}
                            title="Force Reconcile"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateStatus({ id: record.id, status: 'MISMATCHED' })}
                            title="Flag Issue"
                          >
                            <AlertTriangle className="h-4 w-4" />
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
