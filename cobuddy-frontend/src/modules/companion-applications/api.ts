import {
  CompanionApplication,
  ApplicationDecisionPayload,
  ApplicationStatus,
  ScheduleInterviewPayload,
} from './types';
import axios from '@/lib/api/client';
import type { Paginated } from '@/types/pagination';

type ApplicationResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  cityId: string;
  city?: { name: string | Record<string, string> } | null;
  applicationStatus: string;
  createdAt: string;
  reviewNotes?: string | null;
  reviewedByStaffId?: string | null;
  reviewedBy?: { id: string; name: string } | null;
  portfolioUrls?: string[];
  interview?: CompanionApplication['interview'];
  interviewScheduledAt?: string | null;
  interviewerStaffId?: string | null;
  interviewMeetingLink?: string | null;
};
const statuses: Record<string, ApplicationStatus> = {
  SUBMITTED: 'PENDING',
  PENDING: 'PENDING',
  SCREENING: 'IN_REVIEW',
  IN_REVIEW: 'IN_REVIEW',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WAITLISTED: 'WAITLISTED',
};
const mapApplication = (item: ApplicationResponse): CompanionApplication => ({
  id: item.id,
  applicantName: [item.firstName, item.lastName].filter(Boolean).join(' '),
  email: item.email || '',
  phone: item.phone,
  city: typeof item.city?.name === 'string' ? item.city.name : item.city?.name?.en || item.cityId,
  status: statuses[item.applicationStatus] ?? 'UNKNOWN',
  submittedAt: item.createdAt,
  assignedToId: item.reviewedByStaffId ?? undefined,
  assignedTo: item.reviewedBy?.name ?? item.reviewedByStaffId ?? undefined,
  interviewNotes: item.reviewNotes ?? undefined,
  interview:
    item.interview ??
    (item.interviewScheduledAt
      ? {
          scheduledAt: item.interviewScheduledAt,
          interviewerStaffId: item.interviewerStaffId ?? null,
          interviewer: null,
          meetingLink: item.interviewMeetingLink ?? null,
        }
      : null),
  // These profile/assessment fields are not collected by the application schema.
  backgroundCheckStatus: null,
  dateOfBirth: null,
  gender: null,
  bio: null,
  categories: [],
  spokenLanguages: [],
  proposedHourlyRate: null,
  photoUrls: item.portfolioUrls || [],
  workPreferences: {},
});
const applicationPath = (id: string) => '/companion-applications/' + encodeURIComponent(id);
const decisionNotes = (payload: ApplicationDecisionPayload) =>
  [
    payload.notes.trim(),
    ...Object.entries(payload.sectionRejectReasons ?? {})
      .filter(([, reason]) => reason.trim())
      .map(([section, reason]) => '[' + section + '] ' + reason.trim()),
  ]
    .filter(Boolean)
    .join('\n');

export const companionAppApi = {
  getInterviewers: async (id: string): Promise<{ id: string; name: string }[]> => {
    const response = await axios.get(applicationPath(id) + '/interviewers');
    return response.data.data;
  },
  scheduleInterview: async (
    id: string,
    payload: ScheduleInterviewPayload,
  ): Promise<CompanionApplication> => {
    const response = await axios.post(applicationPath(id) + '/schedule-interview', payload);
    return mapApplication(response.data.data.application);
  },
  getApplications: async (
    status = 'ALL',
    page = 1,
    pageSize = 20,
  ): Promise<Paginated<CompanionApplication>> => {
    const serverStatus =
      status === 'ALL'
        ? undefined
        : status === 'PENDING'
          ? 'SUBMITTED'
          : status === 'IN_REVIEW'
            ? 'SCREENING'
            : status;
    const response = await axios.get('/companion-applications', {
      params: { page, pageSize, status: serverStatus },
    });
    return {
      data: (response.data.data as ApplicationResponse[]).map(mapApplication),
      meta: response.data.meta,
    };
  },
  getApplication: async (id: string): Promise<CompanionApplication> => {
    const response = await axios.get(applicationPath(id));
    return mapApplication(response.data.data);
  },
  assignApplication: async (id: string): Promise<CompanionApplication> => {
    const response = await axios.post(applicationPath(id) + '/assign-self');
    return mapApplication(response.data.data);
  },
  submitDecision: async (payload: ApplicationDecisionPayload): Promise<CompanionApplication> => {
    const path = applicationPath(payload.id);
    const notes = decisionNotes(payload);
    if (payload.decision === 'APPROVE') {
      const response = await axios.post(path + '/approve', { notes });
      return mapApplication(response.data.data.application);
    }
    if (payload.decision === 'REJECT') {
      const response = await axios.post(path + '/reject', { reason: notes });
      return mapApplication(response.data.data);
    }
    const response = await axios.patch(path + '/status', {
      status: 'WAITLISTED',
      reviewNotes: notes,
    });
    return mapApplication(response.data.data);
  },
};
