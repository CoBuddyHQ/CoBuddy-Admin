export interface EmergencyWorkflow {
  id: string;
  sosAlertId: string;
  status: 'STEP_1_CONTACT_USER' | 'STEP_2_DISPATCH_AUTHORITIES' | 'STEP_3_LEGAL_HOLD' | 'RESOLVED';
  log: {
    timestamp: string;
    action: string;
    handledBy: string;
  }[];
  createdAt: string;
}
