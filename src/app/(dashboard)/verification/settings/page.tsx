'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { isAxiosError } from 'axios';
import { PageHeader } from '@/components/layout/PageHeader';
import { useVerificationSettings } from '@/modules/verification/hooks/useVerificationSettings';
import type { AutomationThresholds } from '@/modules/verification/types';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/auth/permissions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function VerificationSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const permitted = hasPermission(user?.roles ?? [], 'verification');
  const query = useVerificationSettings(permitted);
  const [draft, setDraft] = useState<AutomationThresholds | null>(null);
  const form = draft ?? query.settings;

  if (!permitted) return <p role="alert">You do not have access to verification settings.</p>;
  if (query.error)
    return (
      <div role="alert" className="space-y-3">
        <p>Unable to load verification settings.</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  if (query.isLoading || !form) return <p role="status">Loading verification settings...</p>;

  const valid =
    Number.isInteger(form.autoApproveThreshold) &&
    Number.isInteger(form.autoRejectThreshold) &&
    form.autoRejectThreshold >= 0 &&
    form.autoApproveThreshold <= 100 &&
    form.autoRejectThreshold < form.autoApproveThreshold;
  const saveMessage = isAxiosError(query.saveError)
    ? query.saveError.response?.data?.error?.message
    : undefined;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !valid || query.isSaving) return;
    try {
      await query.saveSettings(form);
      setDraft(null);
    } catch {
      // Keep the operator's draft available for correction or retry.
    }
  }

  return (
    <div className="max-w-3xl min-w-0 space-y-6">
      <PageHeader
        title="Verification Settings"
        action={
          <Button
            variant="outline"
            onClick={() => router.push('/verification')}
            disabled={query.isSaving}
          >
            <ArrowLeft className="h-4 w-4" /> Queue
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-y py-4">
        <span className="text-sm font-medium">Automatic verification</span>
        <Badge variant="secondary">Provider unavailable</Badge>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <fieldset disabled={query.isSaving} className="space-y-6 min-w-0">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="kyc-provider">Preferred provider</Label>
            <select
              id="kyc-provider"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={form.enabledProvider}
              onChange={(event) =>
                setDraft({
                  ...form,
                  enabledProvider: event.target.value as AutomationThresholds['enabledProvider'],
                })
              }
            >
              <option value="HYPERVERGE">HyperVerge</option>
              <option value="IDFY">IDfy</option>
              <option value="SIGNZY">Signzy</option>
              <option value="KARZA">Karza</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y py-6">
            <div className="space-y-2">
              <Label htmlFor="kyc-approve">Auto-approve threshold (%)</Label>
              <Input
                id="kyc-approve"
                type="number"
                min={1}
                max={100}
                step={1}
                required
                value={Number.isFinite(form.autoApproveThreshold) ? form.autoApproveThreshold : ''}
                onChange={(event) =>
                  setDraft({ ...form, autoApproveThreshold: event.target.valueAsNumber })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kyc-reject">Auto-reject threshold (%)</Label>
              <Input
                id="kyc-reject"
                type="number"
                min={0}
                max={99}
                step={1}
                required
                value={Number.isFinite(form.autoRejectThreshold) ? form.autoRejectThreshold : ''}
                onChange={(event) =>
                  setDraft({ ...form, autoRejectThreshold: event.target.valueAsNumber })
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="kyc-liveness">Require liveness pass</Label>
            <Switch
              id="kyc-liveness"
              checked={form.livenessRequired}
              onCheckedChange={(checked) => setDraft({ ...form, livenessRequired: checked })}
            />
          </div>
        </fieldset>
        {!valid && (
          <p role="alert" className="text-sm text-destructive">
            Thresholds must be whole percentages from 0 to 100, with reject lower than approve.
          </p>
        )}
        {query.saveError && (
          <p role="alert" className="text-sm text-destructive">
            {typeof saveMessage === 'string'
              ? saveMessage
              : 'Unable to save verification settings.'}
          </p>
        )}
        <div className="flex flex-wrap gap-3 border-t pt-4">
          <Button type="submit" disabled={!valid || !draft || query.isSaving}>
            <Save className="h-4 w-4" />
            {query.isSaving ? 'Saving...' : 'Save settings'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!draft || query.isSaving}
            onClick={() => setDraft(null)}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </div>
  );
}
