'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useCancelledBookings } from '@/modules/operations/cancelled-bookings/hooks/useCancelledBookings';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';

export default function CancelledBookingsPage() {
  const { bookings, isLoading: bookingsLoading } = useCancelledBookings();
  const { cancellationReasons, isLoading: masterDataLoading } = useMasterData();

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const getReasonLabel = (code: string) => {
    const r = cancellationReasons.find(x => x.code === code);
    return r ? getLocalizedText(r.label, 'en') : code;
  };

  const listContent = (
    <div className="p-4">
      {bookingsLoading || masterDataLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Session ID</TableHeaderCell>
              <TableHeaderCell>Companion</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Cancelled By</TableHeaderCell>
              <TableHeaderCell>Reason</TableHeaderCell>
              <TableHeaderCell>Penalty</TableHeaderCell>
              <TableHeaderCell>Refund</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map(b => (
              <TableRow key={b.id}>
                <TableCell>{b.sessionId}</TableCell>
                <TableCell className="font-medium">{b.companionName}</TableCell>
                <TableCell>{b.userName}</TableCell>
                <TableCell>
                  <Badge variant={b.cancelledBy === 'SYSTEM' ? 'destructive' : 'secondary'}>
                    {b.cancelledBy}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{getReasonLabel(b.reasonCode)}</div>
                  {b.reasonDetails && <div className="text-xs text-muted-foreground">{b.reasonDetails}</div>}
                </TableCell>
                <TableCell className="text-destructive font-medium">{formatCurrency(b.penaltyApplied)}</TableCell>
                <TableCell className="text-green-600 font-medium">{formatCurrency(b.refundAmount)}</TableCell>
                <TableCell>{new Date(b.dateCancelled).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <ListDetailTemplate
      title="Failed / Cancelled Bookings"
      description="View history of cancelled bookings and associated penalties."
      isDetailOpen={false}
      listContent={listContent}
    />
  );
}
