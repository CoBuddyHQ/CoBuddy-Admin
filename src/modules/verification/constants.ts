export const STATUS_LABELS: Record<string, string> = {
  PENDING_MANUAL_REVIEW: 'Pending Review',
  AUTO_APPROVED: 'Auto-Approved',
  AUTO_REJECTED: 'Auto-Rejected',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const DEFAULT_THRESHOLDS = {
  autoApproveThreshold: 90,
  autoRejectThreshold: 30,
  livenessRequired: true,
  enabledProvider: 'HYPERVERGE' as const,
};
