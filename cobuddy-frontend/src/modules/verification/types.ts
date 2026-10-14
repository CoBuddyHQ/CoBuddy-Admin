export type ApplicantType = 'CUSTOMER' | 'COMPANION';
export type VerificationStatus =
  | 'PENDING_MANUAL_REVIEW'
  | 'AUTO_APPROVED'
  | 'AUTO_REJECTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REQUEST_RESUBMISSION';

export interface VerificationCase {
  id: string;
  caseRef?: string;
  applicantName: string;
  applicantType: ApplicantType;
  faceMatchScore: number | null;
  livenessPass: boolean | null;
  documentValid: boolean | null;
  status: VerificationStatus;
  submittedAt: string;
  documentType: string;
  idDocumentUrl: string;
  selfieUrl: string;
  backgroundDeclarationUrl?: string; // Companion only
  auditTrail: AuditEvent[];
}

export type VerificationFilter = VerificationStatus | 'ALL';

export interface VerificationPage {
  data: VerificationCase[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
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
