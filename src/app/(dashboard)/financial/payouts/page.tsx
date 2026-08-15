'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { usePayouts } from '@/modules/financial/payouts/hooks/usePayouts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function PayoutsPage() {
  const { payouts, isLoading, processPayout, holdPayout } = usePayouts();

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payouts & Escrow Management" 
        description="Release funds to companions from escrow after booking completion."
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Payout ID</TableHeaderCell>
                <TableHeaderCell>Companion</TableHeaderCell>
                <TableHeaderCell>Period</TableHeaderCell>
                <TableHeaderCell>Destination Account</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Due Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payouts.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.companionName}</div>
                    <div className="text-xs text-muted-foreground">{p.companionId}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}</span>
                  </TableCell>
                  <TableCell>
                    {p.payoutMethod ? (
                      <div>
                        <div className="font-medium text-sm">{p.payoutMethod.accountDetails}</div>
                        <Badge variant={p.payoutMethod.verified ? 'outline' : 'destructive'} className="mt-1 text-[10px] h-4">
                          {p.payoutMethod.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not Setup</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{formatCurrency(p.amount)}</span>
                  </TableCell>
                  <TableCell>{new Date(p.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ON_HOLD' ? 'destructive' : p.status === 'PENDING' ? 'outline' : p.status === 'FAILED' ? 'destructive' : 'default'}>
                      {p.status === 'ON_HOLD' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(p.status === 'PENDING' || p.status === 'ON_HOLD' || p.status === 'FAILED') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                          Action <ChevronDown className="ml-2 h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {p.status !== 'ON_HOLD' && <DropdownMenuItem onClick={() => holdPayout(p.id)} className="text-destructive font-medium">Place on Hold</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => processPayout(p.id)} className="text-green-600 font-medium">Process Payout</DropdownMenuItem>
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

