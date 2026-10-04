import { CompanionApplication, ApplicationDecisionPayload } from './types';
import axios from '@/lib/api/client';

const mapApplication = (item: any): CompanionApplication => ({
  id: item.id,
  applicantName: `${item.firstName} ${item.lastName}`,
  email: item.email || '',
  phone: item.phone,
  city: item.cityId,
  status: item.applicationStatus as CompanionApplication['status'],
  submittedAt: item.createdAt,
  interviewNotes: item.reviewNotes,
  backgroundCheckStatus: 'PENDING',
  dateOfBirth: '',
  gender: '',
  bio: '',
  categories: [],
  spokenLanguages: [],
  proposedHourlyRate: 0,
  photoUrls: item.portfolioUrls || [],
  workPreferences: {},
});

export const companionAppApi = {
  getApplications: async (): Promise<CompanionApplication[]> => {
    const response = await axios.get('/companion-applications', {
      params: { page: 1, pageSize: 100 },
    });
    const items = response.data.data?.data ?? response.data.data ?? [];
    return items.map(mapApplication);
  },

  getApplication: async (id: string): Promise<CompanionApplication> => {
    const response = await axios.get(`/companion-applications/${id}`);
    return mapApplication(response.data.data);
  },

  assignApplication: async (id: string, _staffName: string): Promise<CompanionApplication> => {
    const response = await axios.patch(`/companion-applications/${id}/status`, {
      status: 'IN_REVIEW',
    });
    return mapApplication(response.data.data);
  },

  submitDecision: async (payload: ApplicationDecisionPayload): Promise<CompanionApplication> => {
    if (payload.decision === 'APPROVE') {
      const response = await axios.post(`/companion-applications/${payload.id}/approve`);
      return mapApplication(response.data.data?.application ?? response.data.data);
    } else if (payload.decision === 'REJECT') {
      const response = await axios.post(`/companion-applications/${payload.id}/reject`, {
        reason: payload.notes,
      });
      return mapApplication(response.data.data);
    } else {
      const response = await axios.patch(`/companion-applications/${payload.id}/status`, {
        status: 'WAITLISTED',
        reviewNotes: payload.notes,
      });
      return mapApplication(response.data.data);
    }
  },
};
