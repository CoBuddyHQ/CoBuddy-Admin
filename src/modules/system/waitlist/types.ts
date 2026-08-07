export interface WaitlistConfig {
  requireInviteCode: boolean;
  autoApproveWaitlist: boolean;
  maxDailyInvites: number;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  phone: string;
  city: string;
  signupDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
