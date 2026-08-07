'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useGlobalSettings } from '@/modules/system/global-settings/hooks/useGlobalSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GlobalSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useGlobalSettings();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (isLoading || !formData) return <div className="p-6">Loading settings...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Global Settings" 
        description="Manage app-wide metadata and contact information."
      />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Displayed in the Help & Support section of the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Support Phone (Optional)</Label>
                <Input value={formData.supportPhone} onChange={e => setFormData({ ...formData, supportPhone: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal URLs</CardTitle>
              <CardDescription>Links for mandatory policy documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Terms of Service URL</Label>
                <Input value={formData.termsUrl} onChange={e => setFormData({ ...formData, termsUrl: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Privacy Policy URL</Label>
                <Input value={formData.privacyUrl} onChange={e => setFormData({ ...formData, privacyUrl: e.target.value })} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localization Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Default Currency</Label>
                <Input value={formData.defaultCurrency} onChange={e => setFormData({ ...formData, defaultCurrency: e.target.value })} required />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>Default Language</Label>
                <Input value={formData.defaultLanguage} onChange={e => setFormData({ ...formData, defaultLanguage: e.target.value })} required />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>
    </div>
  );
}
