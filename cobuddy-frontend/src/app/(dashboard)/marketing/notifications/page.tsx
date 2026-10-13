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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';
import { Send } from 'lucide-react';
import { useWorkflowOptions } from '@/lib/api/useWorkflowOptions';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CityPicker } from '@/components/ui/city-picker';

export default function NotificationsPage() {
  const { notifications, config, isLoading, createNotification, isCreating, sendNow } =
    useNotifications();
  const { notificationCategories, isLoading: isMasterDataLoading } = useWorkflowOptions();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: '',
    targetAudience: 'ALL',
    targetCity: '',
    status: 'DRAFT',
    scheduledFor: '',
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNotification({
        title: formData.title,
        message: formData.message,
        category: formData.category,
        targetAudience: formData.targetAudience as any,
        targetCity: formData.targetAudience === 'CITY_SPECIFIC' ? formData.targetCity : undefined,
        status: formData.status as any,
        scheduledFor: formData.status === 'SCHEDULED' ? formData.scheduledFor : undefined,
      });
    } catch {
      return;
    }
    setIsOpen(false);
    setFormData({
      title: '',
      message: '',
      category: '',
      targetAudience: 'ALL',
      targetCity: '',
      status: 'DRAFT',
      scheduledFor: '',
    });
  };

  const filteredNotifications =
    categoryFilter === 'ALL'
      ? notifications
      : notifications.filter((n) => n.category === categoryFilter);

  const getCategoryLabel = (code: string) => {
    const cat = notificationCategories.find((c) => c.code === code);
    return cat ? getLocalizedText(cat.label, 'en') : code;
  };

  if (isLoading || isMasterDataLoading) return <div className="">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notifications & Triggers"
        description="Compose announcements and track broadcast delivery."
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filter by Category:</span>
              <Select
                value={categoryFilter}
                onValueChange={(val) => setCategoryFilter(val as string)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {notificationCategories.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {getLocalizedText(c.label, 'en')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsOpen(true)}>New Message</Button>
          </div>
        }
      />

      <Tabs defaultValue="announcements" className="space-y-6 flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="triggers">System Triggers</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="flex-1 overflow-auto min-h-0">
          <div className="bg-background rounded-md border h-full overflow-auto p-4">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Title</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Audience</TableHeaderCell>
                  <TableHeaderCell>Message</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Timing</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(n.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      {n.targetAudience} {n.targetCity && `(${n.targetCity})`}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">{n.message}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          n.status === 'SENT'
                            ? 'default'
                            : n.status === 'SCHEDULED'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {n.status === 'SENT'
                        ? new Date(n.sentAt!).toLocaleString()
                        : n.status === 'SCHEDULED'
                          ? `Sched: ${new Date(n.scheduledFor!).toLocaleString()}`
                          : '-'}
                    </TableCell>
                    <TableCell>
                      {(n.status === 'DRAFT' || n.status === 'SCHEDULED') && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!config?.deliveryConfigured}
                          onClick={() => {
                            if (window.confirm('Send this broadcast to its selected audience?'))
                              sendNow(n.id);
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" /> Send Now
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="triggers" className="flex-1 overflow-auto min-h-0">
          <Card>
            <CardHeader>
              <CardTitle>Notification delivery</CardTitle>
              <CardDescription>
                {config?.deliveryConfigured
                  ? 'Delivery is configured. Broadcast status reflects provider acceptance.'
                  : 'Delivery is not configured yet. You can save drafts; ask your administrator to connect a delivery provider.'}
              </CardDescription>
            </CardHeader>
            <CardContent>Credentials are managed on the server.</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose Push Notification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Message title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((p) => ({ ...p, category: v as string }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {notificationCategories.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {getLocalizedText(c.label, 'en')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(v) => setFormData((p) => ({ ...p, targetAudience: v as string }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <CityPicker
                  value={formData.targetCity}
                  onChange={(targetCity) => setFormData((p) => ({ ...p, targetCity }))}
                />
              </div>
            )}
            <div className="space-y-2 border-t pt-4">
              <Label>Send Options</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((p) => ({ ...p, status: v as string }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Save as Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Schedule for Later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'SCHEDULED' && (
              <div className="space-y-2">
                <Label>Schedule Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData((p) => ({ ...p, scheduledFor: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
