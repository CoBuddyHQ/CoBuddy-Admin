export interface CommissionConfig {
  platformFeePercentage: number;
  minimumWithdrawalAmount: number;
  paymentGatewayFeePercentage: number;
  taxPercentage: number;
  minimumPayoutThreshold: number;
}

export interface PricingConfig {
  baseHourlyRateLimit: {
    min: number;
    max: number;
  };
  specialEventMultiplierLimit: number;
  cancellationFeePercentage: number;
  flatServiceFeeAmount: number;
  newCitySuggestedRateFallback: {
    min: number;
    max: number;
  };
}

export interface SafetyBonusRuleConfig {
  incidentFreeMonths: number;
  bonusAmount: number;
}

export interface ServiceHoursConfig {
  openTime: string;
  closeTime: string;
}

export interface SafetyConfig {
  sosHoldToTriggerSeconds: number;
}

export interface SystemConfig {
  commission: CommissionConfig;
  pricing: PricingConfig;
  safetyBonusRule: SafetyBonusRuleConfig;
  serviceHours: ServiceHoursConfig;
  safety: SafetyConfig;
  customerInterestSelectionLimits: { min: number; max: number };
  companionCategorySelectionLimits: { min: number; max: number };
  companionServiceAreaLimits: { min: number; max: number };
  booking: {
    overlappingSessionConflictDetection: boolean;
  };
  wallet: {
    maxWalletBalance: number;
  };
  walletBalanceLimits: { 
    nonKycMax: number; 
    kycVerifiedMax: number | null;
  };
}
