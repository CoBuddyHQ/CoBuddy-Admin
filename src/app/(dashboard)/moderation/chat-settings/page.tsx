'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useChatSettings } from '@/modules/moderation/chat-settings/hooks/useChatSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function ChatSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useChatSettings();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (isLoading || !formData) return <div className="">Loading settings...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Chat Settings" 
        description="Configure features and retention policies for in-app messaging."
      />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable media sharing between users and companions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Allow Image Sharing</Label>
                  <p className="text-sm text-muted-foreground">Currently restricted for safety.</p>
                </div>
                <Switch 
                  checked={formData.enableImageSharing} 
                  onCheckedChange={v => setFormData({ ...formData, enableImageSharing: v })} 
                />
              </div>

              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Allow Voice Notes</Label>
                  <p className="text-sm text-muted-foreground">Users can send short audio clips.</p>
                </div>
                <Switch 
                  checked={formData.enableVoiceNotes} 
                  onCheckedChange={v => setFormData({ ...formData, enableVoiceNotes: v })} 
                />
              </div>

              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-filter Profanity</Label>
                  <p className="text-sm text-muted-foreground">Automatically censor flagged words.</p>
                </div>
                <Switch 
                  checked={formData.autoFilterProfanity} 
                  onCheckedChange={v => setFormData({ ...formData, autoFilterProfanity: v })} 
                />
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limits & Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Max Message Length (Chars)</Label>
                <Input type="number" min="100" value={formData.maxMessageLength} onChange={e => setFormData({ ...formData, maxMessageLength: Number(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>Retain Chat History (Days)</Label>
                <Input type="number" min="1" value={formData.retainChatHistoryDays} onChange={e => setFormData({ ...formData, retainChatHistoryDays: Number(e.target.value) })} required />
                <p className="text-xs text-muted-foreground">Chats older than this will be permanently deleted from servers to save space.</p>
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

