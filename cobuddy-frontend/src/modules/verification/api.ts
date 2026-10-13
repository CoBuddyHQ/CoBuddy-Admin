import type {
  VerificationCase,
  VerificationPage,
  VerificationFilter,
  DecisionPayload,
  AutomationThresholds,
} from './types';
import axios from '@/lib/api/client';

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

type CaseResponse = Omit<VerificationCase, 'applicantName' | 'auditTrail'> & {
  applicantId: string;
  applicantName?: string;
  auditTrail?: VerificationCase['auditTrail'];
};

const mapCase = (item: CaseResponse): VerificationCase => ({
  ...item,
  applicantName: item.applicantName || item.applicantId,
  faceMatchScore: item.faceMatchScore ?? null,
  livenessPass: item.livenessPass ?? null,
  documentValid: item.documentValid ?? null,
  auditTrail: item.auditTrail || [],
});

export const verificationApi = {
  getCases: async (
    statusFilter?: VerificationFilter,
    page = 1,
    pageSize = 20,
  ): Promise<VerificationPage> => {
    const response = await axios.get<{ data: CaseResponse[]; meta: VerificationPage['meta'] }>(
      '/verification/cases',
      {
        params: { status: statusFilter === 'ALL' ? undefined : statusFilter, page, pageSize },
      },
    );
    return { data: response.data.data.map(mapCase), meta: response.data.meta };
  },

  submitDecision: async (payload: DecisionPayload): Promise<VerificationCase> => {
    const decision =
      payload.decision === 'APPROVE'
        ? 'APPROVED'
        : payload.decision === 'REJECT'
          ? 'REJECTED'
          : 'REQUEST_RESUBMISSION';
    const response = await axios.post<{ data: CaseResponse }>(
      `/verification/cases/${encodeURIComponent(payload.caseId)}/decision`,
      {
        decision,
        reason: payload.reason,
        notes: payload.notes,
      },
    );
    return mapCase(unwrap(response));
  },

  getThresholds: async (): Promise<AutomationThresholds> => {
    const response = await axios.get<{ data: AutomationThresholds }>('/verification/thresholds');
    return unwrap(response);
  },

  updateThresholds: async (payload: AutomationThresholds): Promise<AutomationThresholds> => {
    const { autoApproveThreshold, autoRejectThreshold, livenessRequired, enabledProvider } =
      payload;
    const response = await axios.put<{ data: AutomationThresholds }>('/verification/thresholds', {
      autoApproveThreshold,
      autoRejectThreshold,
      livenessRequired,
      enabledProvider,
    });
    return unwrap(response);
  },
};
