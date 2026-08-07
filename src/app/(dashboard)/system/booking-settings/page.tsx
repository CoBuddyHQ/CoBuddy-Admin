'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useBookingSettings } from '@/modules/system/booking-settings/hooks/useBookingSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BookingSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useBookingSettings();
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
        title="Booking & Session Settings" 
        description="Configure rules for booking durations and cancellations."
      />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Session Duration Limits</CardTitle>
              <CardDescription>Minimum and maximum allowed time for a single booking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Minimum Duration (mins)</Label>
                <Input type="number" min="30" step="30" value={formData.minBookingDurationMins} onChange={e => setFormData({ ...formData, minBookingDurationMins: Number(e.target.value) })} required />
              </div>
              <div className="space-y-2 col-span-1">
                <Label>Maximum Duration (mins)</Label>
                <Input type="number" min="60" step="30" value={formData.maxBookingDurationMins} onChange={e => setFormData({ ...formData, maxBookingDurationMins: Number(e.target.value) })} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeouts & Grace Periods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cancellation Grace Period (mins)</Label>
                <Input type="number" min="0" value={formData.cancellationGracePeriodMins} onChange={e => setFormData({ ...formData, cancellationGracePeriodMins: Number(e.target.value) })} required />
                <p className="text-xs text-muted-foreground">Time window where a customer can cancel without penalty after booking.</p>
              </div>
              <div className="space-y-2">
                <Label>Auto-cancel Unaccepted Booking (mins)</Label>
                <Input type="number" min="1" value={formData.autoCancelUnacceptedMins} onChange={e => setFormData({ ...formData, autoCancelUnacceptedMins: Number(e.target.value) })} required />
                <p className="text-xs text-muted-foreground">Time before a pending request expires if the companion does not accept.</p>
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
