import { GrowthAbuseAlert } from './types';

let mockAlerts: GrowthAbuseAlert[] = [
  {
    id: 'GA-001',
    type: 'REFERRAL_FARMING',
    severity: 'HIGH',
    targetId: 'CUST-8899',
    targetName: 'Sameer K.',
    details: '14 successful referrals to devices with identical IP and device fingerprints.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'OPEN'
  },
  {
    id: 'GA-002',
    type: 'BOT_SIGNUP',
    severity: 'CRITICAL',
    targetId: 'BATCH-77',
    targetName: 'Subnet 192.168.x.x',
    details: '50+ rapid signups detected from a single known datacenter IP range within 10 minutes.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'INVESTIGATING'
  }
];

export const growthAbuseApi = {
  getAlerts: async (): Promise<GrowthAbuseAlert[]> => {
    return [...mockAlerts];
  },
  
  updateStatus: async (id: string, status: GrowthAbuseAlert['status']): Promise<void> => {
    mockAlerts = mockAlerts.map(a => a.id === id ? { ...a, status } : a);
  },

  takeAction: async (id: string, action: 'BLOCK_REFERRAL' | 'BAN_ACCOUNTS'): Promise<void> => {
    mockAlerts = mockAlerts.map(a => a.id === id ? { ...a, status: 'ACTIONED', details: `${a.details} (Action Taken: ${action})` } : a);
  }
};
