'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useRefunds } from '@/modules/financials/refunds/hooks/useRefunds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function RefundsPage() {
  const { refunds, isLoading, processRefund } = useRefunds();

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Refund Processing" 
        description="Review and process user refund requests for disputed or cancelled bookings."
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Refund ID</TableHeaderCell>
                <TableHeaderCell>Booking ID</TableHeaderCell>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {refunds.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.bookingId}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.userName}</div>
                    <div className="text-xs text-muted-foreground">{r.userId}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{formatCurrency(r.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs whitespace-normal text-sm">{r.reason}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'PENDING' ? 'outline' : r.status === 'PROCESSED' ? 'default' : 'secondary'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === 'PENDING' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                          Process <ChevronDown className="ml-2 h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => processRefund({ id: r.id, action: 'APPROVE' })} className="text-green-600 font-medium">Approve Refund</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => processRefund({ id: r.id, action: 'REJECT' })} className="text-destructive font-medium">Reject Request</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
