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
}

export interface SystemConfig {
  commission: CommissionConfig;
  pricing: PricingConfig;
}
