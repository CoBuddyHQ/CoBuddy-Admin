'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAgeEscalation } from '@/modules/safety/age-escalation/hooks/useAgeEscalation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, AlertOctagon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function AgeEscalationPage() {
  const { cases, isLoading, updateStatus } = useAgeEscalation();
  const [resolutionCase, setResolutionCase] = useState<{ id: string, status: 'RESOLVED_CLEARED' | 'RESOLVED_BANNED' } | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const submitResolution = () => {
    if (resolutionCase && resolutionNote.trim()) {
      updateStatus({ id: resolutionCase.id, status: resolutionCase.status, resolutionNote });
      setResolutionCase(null);
      setResolutionNote('');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Age / Minor-Safety Escalation" 
        description="High-priority queue for suspected underage users. Access restricted to Legal & Super Admin."
      />
      <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 text-sm rounded-md border border-red-200 dark:border-red-800 flex items-center gap-2">
        <AlertOctagon className="w-5 h-5" />
        <strong>Critical:</strong> Any case entering this queue should result in an immediate account freeze pending manual legal review.
      </div>

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Discrepancy Details</TableHeaderCell>
                <TableHeaderCell>ID Age</TableHeaderCell>
                <TableHeaderCell>Selfie Age</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Resolution Note</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{c.userName}</div>
                    <div className="text-xs text-muted-foreground">{c.userId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs whitespace-normal text-sm">
                      {c.dobMismatchDetails}
                    </div>
                  </TableCell>
                  <TableCell>{c.idEstimate}</TableCell>
                  <TableCell>
                    <span className="text-destructive font-bold">{c.selfieEstimate}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'PENDING_REVIEW' ? 'destructive' : c.status === 'FROZEN' ? 'secondary' : 'default'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs whitespace-normal text-sm text-muted-foreground">
                      {c.resolutionNote || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                        Update <ChevronDown className="ml-2 h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {c.status === 'PENDING_REVIEW' && <DropdownMenuItem onClick={() => updateStatus({ id: c.id, status: 'FROZEN' })}>Freeze Account</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => { setResolutionCase({ id: c.id, status: 'RESOLVED_CLEARED' }); setResolutionNote(''); }} className="text-green-600 font-medium">Clear User</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setResolutionCase({ id: c.id, status: 'RESOLVED_BANNED' }); setResolutionNote(''); }} className="text-destructive font-medium">Ban User (Underage)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!resolutionCase} onOpenChange={(open) => !open && setResolutionCase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Resolution Note</DialogTitle>
            <DialogDescription>
              A mandatory resolution note is required before this case can be {resolutionCase?.status === 'RESOLVED_CLEARED' ? 'cleared' : 'banned'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              placeholder="Enter resolution details..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              required
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolutionCase(null)}>Cancel</Button>
              <Button onClick={submitResolution} disabled={!resolutionNote.trim()}>
                Confirm Resolution
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

