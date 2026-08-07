'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNotifications } from '@/modules/marketing/notifications/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Send } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, isLoading, createNotification, isCreating, sendNow } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', targetAudience: 'ALL', targetCity: '', status: 'DRAFT', scheduledFor: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createNotification({
      title: formData.title,
      message: formData.message,
      targetAudience: formData.targetAudience as any,
      targetCity: formData.targetAudience === 'CITY_SPECIFIC' ? formData.targetCity : undefined,
      status: formData.status as any,
      scheduledFor: formData.status === 'SCHEDULED' ? formData.scheduledFor : undefined
    });
    setIsOpen(false);
    setFormData({ title: '', message: '', targetAudience: 'ALL', targetCity: '', status: 'DRAFT', scheduledFor: '' });
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Push Notification Broadcaster" 
        description="Send targeted messages to users or companions."
        action={
          <Button onClick={() => setIsOpen(true)}>New Message</Button>
        }
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Audience</TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Timing</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">{n.title}</TableCell>
                  <TableCell>
                    {n.targetAudience} {n.targetCity && `(${n.targetCity})`}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm">{n.message}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={n.status === 'SENT' ? 'default' : n.status === 'SCHEDULED' ? 'secondary' : 'outline'}>
                      {n.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {n.status === 'SENT' ? new Date(n.sentAt!).toLocaleString() : n.status === 'SCHEDULED' ? `Sched: ${new Date(n.scheduledFor!).toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    {(n.status === 'DRAFT' || n.status === 'SCHEDULED') && (
                      <Button variant="outline" size="sm" onClick={() => sendNow(n.id)}>
                        <Send className="w-4 h-4 mr-2" /> Send Now
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Compose Push Notification</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Message title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea placeholder="Type your message here..." value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={formData.targetAudience} onValueChange={v => setFormData(p => ({ ...p, targetAudience: v as string }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Users</SelectItem>
                  <SelectItem value="CUSTOMERS">Customers Only</SelectItem>
                  <SelectItem value="COMPANIONS">Companions Only</SelectItem>
                  <SelectItem value="CITY_SPECIFIC">City Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.targetAudience === 'CITY_SPECIFIC' && (
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="e.g. Mumbai" value={formData.targetCity} onChange={e => setFormData(p => ({ ...p, targetCity: e.target.value }))} required />
              </div>
            )}
            <div className="space-y-2 border-t pt-4">
              <Label>Send Options</Label>
              <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as string }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Save as Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Schedule for Later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'SCHEDULED' && (
              <div className="space-y-2">
                <Label>Schedule Time</Label>
                <Input type="datetime-local" value={formData.scheduledFor} onChange={e => setFormData(p => ({ ...p, scheduledFor: e.target.value }))} required />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating}>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
