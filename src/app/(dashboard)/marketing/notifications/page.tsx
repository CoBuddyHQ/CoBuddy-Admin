'use client';

import { useState, useEffect } from 'react';
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function NotificationsPage() {
  const { notifications, config, isLoading, createNotification, isCreating, sendNow, updateConfig, isUpdatingConfig } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', targetAudience: 'ALL', targetCity: '', status: 'DRAFT', scheduledFor: '' });
  const [configData, setConfigData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setConfigData(config);
    }
  }, [config]);

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

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (configData) updateConfig(configData);
  };

  if (isLoading || (config && !configData)) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Push Notifications & Triggers" 
        description="Broadcast announcements to users and configure system-level push credentials."
        action={
          <Button onClick={() => setIsOpen(true)}>New Message</Button>
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
          </div>
        </TabsContent>

        <TabsContent value="triggers" className="flex-1 overflow-auto min-h-0">
          <form onSubmit={handleConfigSubmit} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>FCM / Android Settings</CardTitle>
                <CardDescription>Firebase Cloud Messaging configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>FCM Server Key</Label>
                  <Input type="password" value={configData?.fcmServerKey || ''} onChange={e => setConfigData({ ...configData, fcmServerKey: e.target.value })} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>APNs / iOS Settings</CardTitle>
                <CardDescription>Apple Push Notification service configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Key ID</Label>
                  <Input value={configData?.apnsKeyId || ''} onChange={e => setConfigData({ ...configData, apnsKeyId: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Team ID</Label>
                  <Input value={configData?.apnsTeamId || ''} onChange={e => setConfigData({ ...configData, apnsTeamId: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Topic</Label>
                  <Input value={configData?.apnsTopic || ''} onChange={e => setConfigData({ ...configData, apnsTopic: e.target.value })} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS Fallback</CardTitle>
                <CardDescription>Send SMS when critical push notifications fail to deliver.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-md">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable SMS Fallback</Label>
                  </div>
                  <Switch 
                    checked={configData?.enableSmsFallback} 
                    onCheckedChange={v => setConfigData({ ...configData, enableSmsFallback: v })} 
                  />
                </div>

                {configData?.enableSmsFallback && (
                  <>
                    <div className="space-y-2">
                      <Label>SMS Provider</Label>
                      <Select value={configData.smsProvider} onValueChange={v => setConfigData({ ...configData, smsProvider: v as string })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TWILIO">Twilio</SelectItem>
                          <SelectItem value="MSG91">MSG91</SelectItem>
                          <SelectItem value="AWS_SNS">AWS SNS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input type="password" value={configData.smsApiKey || ''} onChange={e => setConfigData({ ...configData, smsApiKey: e.target.value })} required />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Button type="submit" size="lg" disabled={isUpdatingConfig}>
              {isUpdatingConfig ? 'Saving...' : 'Save Configuration'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

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
