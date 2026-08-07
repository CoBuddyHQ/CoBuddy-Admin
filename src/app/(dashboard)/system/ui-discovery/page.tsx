'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useUIDiscovery } from '@/modules/system/ui-discovery/hooks/useUIDiscovery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function UIDiscoveryPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useUIDiscovery();
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
        title="App UI & Discovery Settings" 
        description="Configure how the app looks and behaves for end users."
      />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Theme Default</Label>
                  <p className="text-sm text-muted-foreground">Force dark mode for new users.</p>
                </div>
                <Switch 
                  checked={formData.enableDarkThemeDefault} 
                  onCheckedChange={v => setFormData({ ...formData, enableDarkThemeDefault: v })} 
                />
              </div>

              <div className="space-y-2">
                <Label>Home Screen Layout</Label>
                <Select value={formData.homeScreenLayout} onValueChange={v => setFormData({ ...formData, homeScreenLayout: v as string })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRID">Grid View (Photos first)</SelectItem>
                    <SelectItem value="LIST">List View (Details first)</SelectItem>
                    <SelectItem value="MAP_FIRST">Map View (Location first)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Section</CardTitle>
              <CardDescription>Controls for the top carousel on the home screen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Featured Section Title</Label>
                <Input value={formData.featuredSectionTitle} onChange={e => setFormData({ ...formData, featuredSectionTitle: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Max Featured Companions</Label>
                <Input type="number" min="1" max="20" value={formData.maxFeaturedCompanions} onChange={e => setFormData({ ...formData, maxFeaturedCompanions: Number(e.target.value) })} required />
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
