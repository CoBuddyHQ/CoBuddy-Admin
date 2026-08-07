'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConfigFormTemplate } from '@/components/templates/ConfigFormTemplate';
import { useVerificationSettings } from '@/modules/verification/hooks/useVerificationSettings';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VerificationSettingsPage() {
  const router = useRouter();
  const { settings, isLoading, saveSettings, isSaving } = useVerificationSettings();
  
  const [formData, setFormData] = useState({
    autoApproveThreshold: 90,
    autoRejectThreshold: 30,
    livenessRequired: true,
    enabledProvider: 'HYPERVERGE' as any,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  if (isLoading) return <div>Loading settings...</div>;

  const handleSave = () => {
    saveSettings(formData);
  };

  return (
    <ConfigFormTemplate
      title="Verification Automation Settings"
      description="Configure thresholds and rules for auto-approving/rejecting KYC documents."
      onSave={handleSave}
      onCancel={() => router.push('/verification')}
      isSaving={isSaving}
      sections={[
        {
          title: "Provider Configuration",
          description: "Select the primary third-party KYC provider.",
          children: (
            <div className="space-y-2 max-w-sm">
              <Select 
                value={formData.enabledProvider} 
                onValueChange={(v) => setFormData(p => ({ ...p, enabledProvider: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HYPERVERGE">HyperVerge (Default)</SelectItem>
                  <SelectItem value="IDFY">IDfy</SelectItem>
                  <SelectItem value="SIGNZY">Signzy</SelectItem>
                  <SelectItem value="KARZA">Karza Technologies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
        {
          title: "Automation Thresholds",
          description: "Set confidence score requirements for automatic decisions. Cases between these thresholds will require manual review.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-Approve Threshold (%)</label>
                <Input 
                  type="number" 
                  min="0" max="100"
                  value={formData.autoApproveThreshold}
                  onChange={(e) => setFormData(p => ({ ...p, autoApproveThreshold: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">Scores &gt;= this will be approved instantly.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-Reject Threshold (%)</label>
                <Input 
                  type="number" 
                  min="0" max="100"
                  value={formData.autoRejectThreshold}
                  onChange={(e) => setFormData(p => ({ ...p, autoRejectThreshold: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">Scores &lt;= this will be rejected instantly.</p>
              </div>
            </div>
          )
        },
        {
          title: "Liveness Check",
          children: (
            <div className="flex items-center justify-between max-w-xl">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Require Liveness Pass</label>
                <p className="text-xs text-muted-foreground">If disabled, face match score is the only biometric criteria.</p>
              </div>
              <Switch 
                checked={formData.livenessRequired}
                onCheckedChange={(c) => setFormData(p => ({ ...p, livenessRequired: c }))}
              />
            </div>
          )
        }
      ]}
    />
  );
}
