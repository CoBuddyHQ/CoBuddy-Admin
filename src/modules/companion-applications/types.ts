export type ApplicationStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';

export interface CompanionApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  city: string;
  status: ApplicationStatus;
  submittedAt: string;
  assignedTo?: string; // Staff name
  trustScore?: number;
  
  // Profile Data
  dateOfBirth: string;
  gender: string;
  bio: string;
  
  // Assessment
  interviewNotes?: string;
  backgroundCheckStatus: 'PENDING' | 'PASSED' | 'FAILED';
}

export interface ApplicationDecisionPayload {
  id: string;
  decision: 'APPROVE' | 'REJECT' | 'WAITLIST';
  notes: string;
}
