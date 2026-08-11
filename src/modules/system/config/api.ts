import { SystemConfig } from './types';

// Note: Mobile apps should use this config to determine the allowed time-range for bookings and availability.
// Both Companion's availability-slot picker and Customer's booking-time picker should fetch their allowed time-range from this config.
// They should resolve effective hours as `city.serviceHoursOverride ?? systemConfig.serviceHours`.
let currentConfig: SystemConfig = {
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
  },
  safetyBonusRule: {
    incidentFreeMonths: 1,
    bonusAmount: 100,
  },
  serviceHours: {
    openTime: "06:00",
    closeTime: "23:00"
  }
};

export const configApi = {
  getConfig: async (): Promise<SystemConfig> => {
    return Promise.resolve({ ...currentConfig });
  },

  updateConfig: async (payload: SystemConfig): Promise<SystemConfig> => {
    currentConfig = { ...payload };
    return Promise.resolve(currentConfig);
  },

  updateActivityMultiplier: async (activityId: string, multiplier: number): Promise<void> => {
    // Dynamically import masterDataApi to avoid circular dependency if any, or just import it at top.
    const { masterDataApi } = await import('@/modules/system/master-data/api');
    return masterDataApi.updateInterestMultiplier(activityId, multiplier);
  }
};
