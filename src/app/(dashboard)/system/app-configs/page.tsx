'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppConfigs } from '@/modules/system/app-configs/hooks/useAppConfigs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle } from 'lucide-react';

export default function AppConfigsPage() {
  const { config, isLoading, updateConfig, isUpdating } = useAppConfigs();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (isLoading || !formData) return <div className="">Loading configuration...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Dynamic App Configs" 
        description="Control maintenance mode, forced updates, and global limits."
      />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          
          <Card className={formData.maintenanceMode ? 'border-destructive' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${formData.maintenanceMode ? 'text-destructive' : 'text-muted-foreground'}`} />
                Maintenance Mode
              </CardTitle>
              <CardDescription>If enabled, all users will be locked out of the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-md bg-muted/50">
                <Label className="text-base font-semibold">Enable Maintenance Mode</Label>
                <Switch 
                  checked={formData.maintenanceMode} 
                  onCheckedChange={v => setFormData({ ...formData, maintenanceMode: v })} 
                />
              </div>
              {formData.maintenanceMode && (
                <div className="space-y-2">
                  <Label>Maintenance Message (Shown to users)</Label>
                  <Textarea 
                    value={formData.maintenanceMessage} 
                    onChange={e => setFormData({ ...formData, maintenanceMessage: e.target.value })} 
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Updates & Versions</CardTitle>
              <CardDescription>Force users to update their apps if they are below the minimum version.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-base">iOS Force Update</Label>
                    <Switch 
                      checked={formData.forceUpdateIos} 
                      onCheckedChange={v => setFormData({ ...formData, forceUpdateIos: v })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum iOS App Version</Label>
                    <Input 
                      value={formData.minVersionIos} 
                      onChange={e => setFormData({ ...formData, minVersionIos: e.target.value })} 
                      disabled={!formData.forceUpdateIos}
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-base">Android Force Update</Label>
                    <Switch 
                      checked={formData.forceUpdateAndroid} 
                      onCheckedChange={v => setFormData({ ...formData, forceUpdateAndroid: v })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Android App Version</Label>
                    <Input 
                      value={formData.minVersionAndroid} 
                      onChange={e => setFormData({ ...formData, minVersionAndroid: e.target.value })} 
                      disabled={!formData.forceUpdateAndroid}
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-sm">
                <Label>Max Daily Bookings Per User</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.maxDailyBookingsPerUser} 
                  onChange={e => setFormData({ ...formData, maxDailyBookingsPerUser: Number(e.target.value) })} 
                />
              </div>
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

