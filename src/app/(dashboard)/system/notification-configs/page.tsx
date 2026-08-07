'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNotificationConfigs } from '@/modules/system/notification-configs/hooks/useNotificationConfigs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function NotificationConfigsPage() {
  const { config, isLoading, updateConfig, isUpdating } = useNotificationConfigs();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (isLoading || !formData) return <div className="p-6">Loading config...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Push Notification & SMS Configs" 
        description="Manage third-party credentials for sending alerts."
      />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>FCM / Android Settings</CardTitle>
              <CardDescription>Firebase Cloud Messaging configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>FCM Server Key</Label>
                <Input type="password" value={formData.fcmServerKey} onChange={e => setFormData({ ...formData, fcmServerKey: e.target.value })} required />
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
                <Input value={formData.apnsKeyId} onChange={e => setFormData({ ...formData, apnsKeyId: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Team ID</Label>
                <Input value={formData.apnsTeamId} onChange={e => setFormData({ ...formData, apnsTeamId: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Bundle Topic</Label>
                <Input value={formData.apnsTopic} onChange={e => setFormData({ ...formData, apnsTopic: e.target.value })} required />
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
                  checked={formData.enableSmsFallback} 
                  onCheckedChange={v => setFormData({ ...formData, enableSmsFallback: v })} 
                />
              </div>

              {formData.enableSmsFallback && (
                <>
                  <div className="space-y-2">
                    <Label>SMS Provider</Label>
                    <Select value={formData.smsProvider} onValueChange={v => setFormData({ ...formData, smsProvider: v as string })}>
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
                    <Input type="password" value={formData.smsApiKey} onChange={e => setFormData({ ...formData, smsApiKey: e.target.value })} required />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Configuration'}
          </Button>
        </form>
      </div>
    </div>
  );
}
