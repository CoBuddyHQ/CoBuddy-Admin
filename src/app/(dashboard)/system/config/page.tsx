'use client';

import { useState, useEffect } from 'react';
import { ConfigFormTemplate } from '@/components/templates/ConfigFormTemplate';
import { useSystemConfig } from '@/modules/system/config/hooks/useSystemConfig';
import { Input } from '@/components/ui/input';

export default function SystemConfigPage() {
  const { config, isLoading, saveConfig, isSaving } = useSystemConfig();
  
  const [formData, setFormData] = useState({
    commission: {
      platformFeePercentage: 15,
      minimumWithdrawalAmount: 1000,
      paymentGatewayFeePercentage: 2,
      taxPercentage: 18,
    },
    pricing: {
      baseHourlyRateLimit: { min: 200, max: 2000 },
      specialEventMultiplierLimit: 2.0,
      cancellationFeePercentage: 10,
    }
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (isLoading) return <div className="p-6">Loading config...</div>;

  const handleSave = () => {
    saveConfig(formData);
  };

  return (
    <ConfigFormTemplate
      title="Global Configuration (Commission & Pricing)"
      description="Set app-wide boundaries, limits, and platform fee percentages."
      onSave={handleSave}
      isSaving={isSaving}
      sections={[
        {
          title: "Platform Fees & Payouts",
          description: "Global settings for commissions and payouts.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Fee (%)</label>
                <Input 
                  type="number" min="0" max="100"
                  value={formData.commission.platformFeePercentage}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    commission: { ...p.commission, platformFeePercentage: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Gateway Fee (%)</label>
                <Input 
                  type="number" min="0" max="100" step="0.1"
                  value={formData.commission.paymentGatewayFeePercentage}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    commission: { ...p.commission, paymentGatewayFeePercentage: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Applicable Tax (GST/VAT) (%)</label>
                <Input 
                  type="number" min="0" max="100"
                  value={formData.commission.taxPercentage}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    commission: { ...p.commission, taxPercentage: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Withdrawal Amount (₹)</label>
                <Input 
                  type="number" min="100"
                  value={formData.commission.minimumWithdrawalAmount}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    commission: { ...p.commission, minimumWithdrawalAmount: Number(e.target.value) } 
                  }))}
                />
              </div>
            </div>
          )
        },
        {
          title: "Pricing Boundaries",
          description: "Define the min/max limits within which companions can set their rates.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Hourly Rate (₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.pricing.baseHourlyRateLimit.min}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    pricing: { ...p.pricing, baseHourlyRateLimit: { ...p.pricing.baseHourlyRateLimit, min: Number(e.target.value) } } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Maximum Hourly Rate (₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.pricing.baseHourlyRateLimit.max}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    pricing: { ...p.pricing, baseHourlyRateLimit: { ...p.pricing.baseHourlyRateLimit, max: Number(e.target.value) } } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Special Event Max Multiplier (x)</label>
                <Input 
                  type="number" min="1" max="10" step="0.1"
                  value={formData.pricing.specialEventMultiplierLimit}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    pricing: { ...p.pricing, specialEventMultiplierLimit: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cancellation Fee (%)</label>
                <Input 
                  type="number" min="0" max="100"
                  value={formData.pricing.cancellationFeePercentage}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    pricing: { ...p.pricing, cancellationFeePercentage: Number(e.target.value) } 
                  }))}
                />
              </div>
            </div>
          )
        }
      ]}
    />
  );
}
