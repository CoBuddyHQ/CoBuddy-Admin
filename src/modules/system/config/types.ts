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
}

export interface SafetyBonusRuleConfig {
  incidentFreeMonths: number;
  bonusAmount: number;
}

export interface ServiceHoursConfig {
  openTime: string;
  closeTime: string;
}

export interface SystemConfig {
  commission: CommissionConfig;
  pricing: PricingConfig;
  safetyBonusRule: SafetyBonusRuleConfig;
  serviceHours: ServiceHoursConfig;
}
