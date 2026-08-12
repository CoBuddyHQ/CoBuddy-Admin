export type ApplicantType = 'CUSTOMER' | 'COMPANION';
export type VerificationStatus = 'PENDING_MANUAL_REVIEW' | 'AUTO_APPROVED' | 'AUTO_REJECTED' | 'APPROVED' | 'REJECTED';

export interface VerificationCase {
  id: string;
  applicantName: string;
  applicantType: ApplicantType;
  faceMatchScore: number;
  livenessPass: boolean;
  documentValid: boolean;
  status: VerificationStatus;
  submittedAt: string;
  documentType: string;
  idDocumentUrl: string;
  selfieUrl: string;
  backgroundDeclarationUrl?: string; // Companion only
  auditTrail: AuditEvent[];
}

export interface AuditEvent {
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface DecisionPayload {
  caseId: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION';
  reason?: string;
  notes?: string;
}

export interface AutomationThresholds {
  autoApproveThreshold: number; // default 90
  autoRejectThreshold: number; // default 30
  livenessRequired: boolean; // toggle
  enabledProvider: 'HYPERVERGE' | 'IDFY' | 'SIGNZY' | 'KARZA';
}
