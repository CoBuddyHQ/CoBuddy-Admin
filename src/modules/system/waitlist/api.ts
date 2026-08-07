import { WaitlistConfig, WaitlistEntry } from './types';

let mockConfig: WaitlistConfig = {
  requireInviteCode: true,
  autoApproveWaitlist: false,
  maxDailyInvites: 50,
};

let mockEntries: WaitlistEntry[] = [
  { id: 'WL-01', email: 'test1@example.com', phone: '+919876543210', city: 'Mumbai', signupDate: new Date().toISOString(), status: 'PENDING' },
  { id: 'WL-02', email: 'test2@example.com', phone: '+919876543211', city: 'Delhi', signupDate: new Date(Date.now() - 86400000).toISOString(), status: 'APPROVED' },
];

export const waitlistApi = {
  getConfig: async (): Promise<WaitlistConfig> => Promise.resolve({ ...mockConfig }),
  updateConfig: async (config: WaitlistConfig): Promise<void> => {
    mockConfig = { ...config };
    return Promise.resolve();
  },
  getEntries: async (): Promise<WaitlistEntry[]> => Promise.resolve([...mockEntries]),
  approveEntry: async (id: string): Promise<void> => {
    const e = mockEntries.find(x => x.id === id);
    if (e) e.status = 'APPROVED';
    return Promise.resolve();
  }
};
