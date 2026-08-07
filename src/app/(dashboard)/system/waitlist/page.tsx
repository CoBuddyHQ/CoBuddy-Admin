'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useWaitlist } from '@/modules/system/waitlist/hooks/useWaitlist';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function WaitlistPage() {
  const { config, entries, isLoading, updateConfig, isUpdating, approveEntry } = useWaitlist();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (isLoading || !formData) return <div className="p-6">Loading waitlist data...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Waitlist & Invitation Codes" 
        description="Control access to the app by managing invites and waitlisted users."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Access Configuration</CardTitle>
            <CardDescription>Toggle how new users sign up.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Require Invite Code</Label>
                  <p className="text-sm text-muted-foreground">If disabled, anyone can sign up instantly.</p>
                </div>
                <Switch 
                  checked={formData.requireInviteCode} 
                  onCheckedChange={v => setFormData({ ...formData, requireInviteCode: v })} 
                />
              </div>

              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-approve Waitlist</Label>
                  <p className="text-sm text-muted-foreground">Bypasses manual review.</p>
                </div>
                <Switch 
                  checked={formData.autoApproveWaitlist} 
                  onCheckedChange={v => setFormData({ ...formData, autoApproveWaitlist: v })} 
                />
              </div>

              <div className="space-y-2">
                <Label>Max Daily Invites (Overall)</Label>
                <Input type="number" min="0" value={formData.maxDailyInvites} onChange={e => setFormData({ ...formData, maxDailyInvites: Number(e.target.value) })} required />
              </div>

              <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? 'Saving...' : 'Update Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Waitlisted Users</CardTitle>
            <CardDescription>Users pending approval to join the platform.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Email / Phone</TableHeaderCell>
                  <TableHeaderCell>City</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="font-medium">{entry.email}</div>
                      <div className="text-xs text-muted-foreground">{entry.phone}</div>
                    </TableCell>
                    <TableCell>{entry.city}</TableCell>
                    <TableCell>{new Date(entry.signupDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'APPROVED' ? 'default' : entry.status === 'PENDING' ? 'outline' : 'secondary'}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.status === 'PENDING' && (
                        <Button size="sm" onClick={() => approveEntry(entry.id)}>Approve</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
