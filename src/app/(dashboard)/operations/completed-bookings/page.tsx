'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useCompletedBookings } from '@/modules/operations/completed-bookings/hooks/useCompletedBookings';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import { Star } from 'lucide-react';

export default function CompletedBookingsPage() {
  const { bookings, isLoading } = useCompletedBookings();

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const listContent = (
    <div className="p-4">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Session ID</TableHeaderCell>
              <TableHeaderCell>Companion</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell>Total Cost</TableHeaderCell>
              <TableHeaderCell>Rating</TableHeaderCell>
              <TableHeaderCell>Date Completed</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map(b => (
              <TableRow key={b.id}>
                <TableCell>{b.sessionId}</TableCell>
                <TableCell className="font-medium">{b.companionName}</TableCell>
                <TableCell>{b.userName}</TableCell>
                <TableCell>{Math.floor(b.durationMinutes / 60)}h {b.durationMinutes % 60}m</TableCell>
                <TableCell>{formatCurrency(b.totalCost)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                    {b.rating}
                  </div>
                </TableCell>
                <TableCell>{new Date(b.dateCompleted).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <ListDetailTemplate
      title="Completed Bookings Log"
      description="View history of all successfully completed sessions."
      isDetailOpen={false}
      listContent={listContent}
    />
  );
}
