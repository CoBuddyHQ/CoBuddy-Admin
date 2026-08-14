'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useBans } from '@/modules/moderation/bans/hooks/useBans';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function BansPage() {
  const { restrictions, isLoading, applyRestriction, liftRestriction } = useBans();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ userId: '', restrictionType: 'TEMP_BAN', reason: '', durationDays: '' });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    applyRestriction({
      ...formData,
      durationDays: formData.durationDays ? Number(formData.durationDays) : undefined
    });
    setIsOpen(false);
    setFormData({ userId: '', restrictionType: 'TEMP_BAN', reason: '', durationDays: '' });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Ban & Restriction Management" 
        description="Apply restrictions, suspend accounts, and forcefully logout users globally."
        action={
          <Button onClick={() => setIsOpen(true)}>Apply New Restriction</Button>
        }
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>User ID</TableHeaderCell>
                <TableHeaderCell>User Name</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Restriction</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Applied</TableHeaderCell>
                <TableHeaderCell>Expires</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {restrictions.map(r => (
                <TableRow key={r.userId}>
                  <TableCell>{r.userId}</TableCell>
                  <TableCell>{r.userName}</TableCell>
                  <TableCell>{r.userType}</TableCell>
                  <TableCell>
                    <Badge variant={r.restrictionType === 'PERM_BAN' ? 'destructive' : r.restrictionType === 'TEMP_BAN' ? 'default' : 'secondary'}>
                      {r.restrictionType}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell>{new Date(r.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : 'Permanent'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => liftRestriction(r.userId)}>
                      Lift
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Restriction</DialogTitle></DialogHeader>
          <form onSubmit={handleApply} className="space-y-4 pt-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 text-sm rounded-md mb-4 border border-red-200 dark:border-red-800">
              <strong>Note:</strong> Applying any ban or restriction will immediately force logout all active sessions for the user.
            </div>
            <Input placeholder="User ID" value={formData.userId} onChange={e => setFormData(p => ({ ...p, userId: e.target.value }))} required />
            <Select value={formData.restrictionType} onValueChange={v => setFormData(p => ({ ...p, restrictionType: v as string }))}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WARNING">Warning Only</SelectItem>
                <SelectItem value="FEATURE_LOCK">Feature Lock</SelectItem>
                <SelectItem value="TEMP_BAN">Temporary Ban</SelectItem>
                <SelectItem value="PERM_BAN">Permanent Ban</SelectItem>
              </SelectContent>
            </Select>
            {formData.restrictionType === 'TEMP_BAN' && (
              <Input type="number" placeholder="Duration (Days)" min="1" value={formData.durationDays} onChange={e => setFormData(p => ({ ...p, durationDays: e.target.value }))} required />
            )}
            <Textarea placeholder="Reason (Internal & User-facing)" value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} required />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive">Apply & Force Logout</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

