import axios from '@/lib/api/client';
import { SystemConfig } from './types';

const CONFIG_KEY = 'admin-system-config';
const DEFAULT_CONFIG: SystemConfig = {
  commission: {
    platformFeePercentage: 15,
    minimumWithdrawalAmount: 1000,
    paymentGatewayFeePercentage: 2,
    taxPercentage: 18,
    minimumPayoutThreshold: 100,
  },
  pricing: {
    baseHourlyRateLimit: { min: 200, max: 2000 },
    specialEventMultiplierLimit: 2,
    cancellationFeePercentage: 10,
    flatServiceFeeAmount: 50,
    newCitySuggestedRateFallback: { min: 500, max: 900 },
  },
  safetyBonusRule: { incidentFreeMonths: 1, bonusAmount: 100 },
  serviceHours: { openTime: '06:00', closeTime: '23:00' },
  safety: { sosHoldToTriggerSeconds: 3 },
  customerInterestSelectionLimits: { min: 3, max: 10 },
  companionCategorySelectionLimits: { min: 1, max: 3 },
  companionServiceAreaLimits: { min: 1, max: 8 },
  booking: { overlappingSessionConflictDetection: true },
  wallet: { maxWalletBalance: 50000 },
  walletBalanceLimits: { nonKycMax: 10000, kycVerifiedMax: null },
};

const unwrap = (response: any) => response.data.data?.data ?? response.data.data;

export const configApi = {
  getConfig: async (): Promise<SystemConfig> => {
    const response = await axios.get('/system/app-configs/key/' + CONFIG_KEY);
    return (unwrap(response)?.value ?? DEFAULT_CONFIG) as SystemConfig;
  },

  updateConfig: async (payload: SystemConfig): Promise<SystemConfig> => {
    const response = await axios.put('/system/app-configs/key/' + CONFIG_KEY, { value: payload });
    return (unwrap(response)?.value ?? DEFAULT_CONFIG) as SystemConfig;
  },

  updateActivityMultiplier: async (activityId: string, multiplier: number): Promise<void> => {
    await axios.patch('/master-data/interests/' + activityId + '/multiplier', {
      basePriceMultiplier: multiplier,
    });
  },
};
