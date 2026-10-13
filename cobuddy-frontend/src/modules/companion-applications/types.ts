export type ApplicationStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'INTERVIEW_SCHEDULED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'UNKNOWN';

export interface CompanionApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  city: string;
  status: ApplicationStatus;
  submittedAt: string;
  assignedTo?: string; // Staff name
  assignedToId?: string;
  trustScore?: number;

  // Profile Data
  dateOfBirth: string | null;
  gender: string | null;
  bio: string | null;
  categories: string[];
  spokenLanguages: string[];
  proposedHourlyRate: number | null;
  photoUrls: string[];
  workPreferences: {
    communicationStyle?: string;
    activityPace?: string;
  };

  // Assessment
  interview: {
    scheduledAt: string;
    interviewerStaffId: string | null;
    interviewer: { id: string; name: string } | null;
    meetingLink: string | null;
  } | null;
  interviewNotes?: string;
  backgroundCheckStatus: 'PENDING' | 'PASSED' | 'FAILED' | null;
}

export interface ScheduleInterviewPayload {
  scheduledAt: string;
  interviewerStaffId: string;
  meetingLink?: string;
}

export interface ApplicationDecisionPayload {
  id: string;
  decision: 'APPROVE' | 'REJECT' | 'WAITLIST';
  notes: string;
  sectionRejectReasons?: Record<string, string>;
}
