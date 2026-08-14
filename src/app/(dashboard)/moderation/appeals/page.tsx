'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAppeals } from '@/modules/moderation/appeals/hooks/useAppeals';
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

export default function AppealsPage() {
  const { appeals, isLoading, resolveAppeal } = useAppeals();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Appeals & Ban Reversal Review" 
        description="Review user appeals against bans and restrictions."
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Original Ban Reason</TableHeaderCell>
                <TableHeaderCell>Appeal Statement</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appeals.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{a.userName}</div>
                    <div className="text-xs text-muted-foreground">{a.userId}</div>
                  </TableCell>
                  <TableCell>{a.originalBanReason}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium mt-1">
                      &quot;{a.appealStatement}&quot;
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'PENDING' ? 'destructive' : 'secondary'}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {a.status === 'PENDING' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                          Resolve <ChevronDown className="ml-2 h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => resolveAppeal({ id: a.id, action: 'UPHELD' })} className="text-destructive font-medium">Uphold Ban</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => resolveAppeal({ id: a.id, action: 'REDUCED_TO_WARNING' })}>Reduce to Warning</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => resolveAppeal({ id: a.id, action: 'REVERSED' })} className="text-green-600 font-medium">Reverse Ban</DropdownMenuItem>
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

