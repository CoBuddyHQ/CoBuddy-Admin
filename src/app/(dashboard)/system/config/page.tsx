'use client';

import { useState, useEffect } from 'react';
import { ConfigFormTemplate } from '@/components/templates/ConfigFormTemplate';
import { useSystemConfig } from '@/modules/system/config/hooks/useSystemConfig';
import { Input } from '@/components/ui/input';

import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';

export default function SystemConfigPage() {
  const { config, isLoading, saveConfig, isSaving, updateActivityMultiplier } = useSystemConfig();
  const { interests } = useMasterData();
  
  const [formData, setFormData] = useState({
    commission: {
      platformFeePercentage: 15,
      minimumWithdrawalAmount: 1000,
      paymentGatewayFeePercentage: 2,
      taxPercentage: 18,
      minimumPayoutThreshold: 100,
    },
    pricing: {
      baseHourlyRateLimit: { min: 200, max: 2000 },
      specialEventMultiplierLimit: 2.0,
      cancellationFeePercentage: 10,
      flatServiceFeeAmount: 50,
      newCitySuggestedRateFallback: { min: 500, max: 900 },
    },
    safetyBonusRule: {
      incidentFreeMonths: 1,
      bonusAmount: 100,
    },
    serviceHours: {
      openTime: "06:00",
      closeTime: "23:00"
    },
    safety: {
      sosHoldToTriggerSeconds: 3
    },
    customerInterestSelectionLimits: { min: 3, max: 10 },
    companionCategorySelectionLimits: { min: 1, max: 3 },
    companionServiceAreaLimits: { min: 1, max: 8 },
    booking: {
      overlappingSessionConflictDetection: true,
    },
    wallet: {
      maxWalletBalance: 50000,
    },
    walletBalanceLimits: {
      nonKycMax: 10000,
      kycVerifiedMax: null as number | null,
    }
  });

  const [activityValues, setActivityValues] = useState<Record<string, number | string>>({});

  useEffect(() => {
    if (config) {
      setFormData(config as any);
    }
  }, [config]);

  if (isLoading) return <div className="">Loading config...</div>;

  const handleSave = () => {
    saveConfig(formData as any);
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Payout Threshold (₹)</label>
                <Input 
                  type="number" min="100"
                  value={formData.commission.minimumPayoutThreshold}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    commission: { ...p.commission, minimumPayoutThreshold: Number(e.target.value) } 
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Service Fee (Flat ₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.pricing.flatServiceFeeAmount}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    pricing: { ...p.pricing, flatServiceFeeAmount: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New City Suggested Min (₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.pricing.newCitySuggestedRateFallback.min}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    pricing: { ...p.pricing, newCitySuggestedRateFallback: { ...p.pricing.newCitySuggestedRateFallback, min: Number(e.target.value) } } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New City Suggested Max (₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.pricing.newCitySuggestedRateFallback.max}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    pricing: { ...p.pricing, newCitySuggestedRateFallback: { ...p.pricing.newCitySuggestedRateFallback, max: Number(e.target.value) } } 
                  }))}
                />
              </div>
            </div>
          )
        },
        {
          title: "Safety Bonus Trigger Rule",
          description: "Define the rules for companion safety bonuses.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Incident-Free Months</label>
                <Input 
                  type="number" min="1"
                  value={formData.safetyBonusRule?.incidentFreeMonths || 1}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    safetyBonusRule: { ...p.safetyBonusRule, incidentFreeMonths: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bonus Amount (₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.safetyBonusRule?.bonusAmount || 0}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    safetyBonusRule: { ...p.safetyBonusRule, bonusAmount: Number(e.target.value) } 
                  }))}
                />
              </div>
            </div>
          )
        },
        {
          title: "Platform-Wide Service Hours",
          description: "Define the default daily time-window during which the service is available globally.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Opening Time</label>
                <Input 
                  type="time" 
                  value={formData.serviceHours?.openTime || "06:00"}
                  onChange={(e) => {
                    const newOpen = e.target.value;
                    const close = formData.serviceHours?.closeTime || "23:00";
                    if (newOpen && newOpen < close) {
                      setFormData(p => ({ ...p, serviceHours: { ...p.serviceHours, openTime: newOpen } }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Closing Time</label>
                <Input 
                  type="time" 
                  value={formData.serviceHours?.closeTime || "23:00"}
                  onChange={(e) => {
                    const newClose = e.target.value;
                    const open = formData.serviceHours?.openTime || "06:00";
                    if (newClose && newClose > open) {
                      setFormData(p => ({ ...p, serviceHours: { ...p.serviceHours, closeTime: newClose } }));
                    }
                  }}
                />
              </div>
            </div>
          )
        },
        {
          title: "Safety Controls",
          description: "Manage app safety parameters and thresholds.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">SOS Hold-to-Trigger Duration (seconds)</label>
                <Input 
                  type="number" min="1" max="10"
                  value={formData.safety?.sosHoldToTriggerSeconds || 3}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    safety: { ...p.safety, sosHoldToTriggerSeconds: Number(e.target.value) } 
                  }))}
                />
              </div>
            </div>
          )
        },
        {
          title: "Booking & Wallet Limits",
          description: "Manage overlapping conflicts and maximum wallet limits.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2 flex flex-col justify-center">
                <label className="text-sm font-medium mb-2">Overlapping Session Detection</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="checkbox"
                    className="w-4 h-4"
                    checked={formData.booking?.overlappingSessionConflictDetection}
                    onChange={(e) => setFormData(p => ({ 
                      ...p, 
                      booking: { ...p.booking, overlappingSessionConflictDetection: e.target.checked } 
                    }))}
                  />
                  <span className="text-sm">Enabled</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Wallet Balance (₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.wallet?.maxWalletBalance || 50000}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    wallet: { ...p.wallet, maxWalletBalance: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Non-KYC Wallet Limit (₹)</label>
                <Input 
                  type="number" min="0"
                  value={formData.walletBalanceLimits?.nonKycMax || 10000}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    walletBalanceLimits: { ...p.walletBalanceLimits, nonKycMax: Number(e.target.value), kycVerifiedMax: p.walletBalanceLimits?.kycVerifiedMax ?? null } 
                  }))}
                />
              </div>
              <div className="space-y-2 flex flex-col justify-center">
                <label className="text-sm font-medium">KYC Verified Wallet Limit (₹)</label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" min="0"
                    placeholder="Unlimited"
                    value={formData.walletBalanceLimits?.kycVerifiedMax ?? ''}
                    onChange={(e) => setFormData(p => ({ 
                      ...p, 
                      walletBalanceLimits: { ...p.walletBalanceLimits, nonKycMax: p.walletBalanceLimits?.nonKycMax ?? 10000, kycVerifiedMax: e.target.value === '' ? null : Number(e.target.value) } 
                    }))}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">(Leave blank for unlimited)</span>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Selection Limits",
          description: "Define how many options users can select for interests and service areas.",
          children: (
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Interests (Min)</label>
                <Input 
                  type="number" min="1"
                  value={formData.customerInterestSelectionLimits?.min || 3}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    customerInterestSelectionLimits: { ...p.customerInterestSelectionLimits, min: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Interests (Max)</label>
                <Input 
                  type="number" min="1"
                  value={formData.customerInterestSelectionLimits?.max || 10}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    customerInterestSelectionLimits: { ...p.customerInterestSelectionLimits, max: Number(e.target.value) } 
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Companion Categories (Min)</label>
                <Input 
                  type="number" min="1"
                  value={formData.companionCategorySelectionLimits?.min || 1}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    companionCategorySelectionLimits: { ...p.companionCategorySelectionLimits, min: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Companion Categories (Max)</label>
                <Input 
                  type="number" min="1"
                  value={formData.companionCategorySelectionLimits?.max || 3}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    companionCategorySelectionLimits: { ...p.companionCategorySelectionLimits, max: Number(e.target.value) } 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Companion Service Areas (Min)</label>
                <Input 
                  type="number" min="1"
                  value={formData.companionServiceAreaLimits?.min || 1}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    companionServiceAreaLimits: { ...p.companionServiceAreaLimits, min: Number(e.target.value) } 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Companion Service Areas (Max)</label>
                <Input 
                  type="number" min="1"
                  value={formData.companionServiceAreaLimits?.max || 8}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    companionServiceAreaLimits: { ...p.companionServiceAreaLimits, max: Number(e.target.value) } 
                  }))}
                />
              </div>
            </div>
          )
        },
        {
          title: "Activity Multipliers",
          description: "Set base price multipliers for different activities/interests.",
          children: (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-2xl">
              {interests.filter(i => i.active).map(interest => (
                <div key={interest.id} className="flex items-center justify-between space-y-2 p-2 rounded-md border bg-muted/20">
                  <label className="text-sm font-medium">{getLocalizedText(interest.name, 'en')} ({interest.type})</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" min="1" max="5" step="0.1" className="w-24 text-right"
                      value={activityValues[interest.id] !== undefined ? activityValues[interest.id] : (interest.basePriceMultiplier || 1.0)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setActivityValues(prev => ({ ...prev, [interest.id]: isNaN(val) ? '' : val }));
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          updateActivityMultiplier({ id: interest.id, multiplier: val });
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground font-mono">x</span>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      ]}
    />
  );
}

