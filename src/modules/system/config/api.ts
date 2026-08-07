import { SystemConfig } from './types';

let currentConfig: SystemConfig = {
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
};

export const configApi = {
  getConfig: async (): Promise<SystemConfig> => {
    return Promise.resolve({ ...currentConfig });
  },

  updateConfig: async (payload: SystemConfig): Promise<SystemConfig> => {
    currentConfig = { ...payload };
    return Promise.resolve(currentConfig);
  }
};
