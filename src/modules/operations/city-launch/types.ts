export type LaunchStatus = 'PLANNING' | 'IN_PROGRESS' | 'READY' | 'LIVE';

export interface CityLaunch {
  id: string;
  cityName: string;
  region: string;
  targetLaunchDate: string;
  status: LaunchStatus;
  checklist: {
    id: string;
    task: string;
    completed: boolean;
  }[];
  managerName: string;
}

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
