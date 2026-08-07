import { FraudAlert, FraudReason } from './types';

let mockAlerts: FraudAlert[] = [
  {
    id: 'FRAUD-101',
    userId: 'USR-112',
    userName: 'John Doe',
    userType: 'CUSTOMER',
    reason: 'SUSPICIOUS_TRANSACTION',
    severity: 'HIGH',
    status: 'PENDING',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: 'Multiple failed high-value bookings using different cards within 10 minutes.'
  },
  {
    id: 'FRAUD-102',
    userId: 'COMP-998',
    userName: 'Sarah Lee',
    userType: 'COMPANION',
    reason: 'GPS_SPOOFING',
    severity: 'CRITICAL',
    status: 'PENDING',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: 'Device GPS teleported from Mumbai to Delhi in 5 minutes. Mock location app detected.'
  },
  {
    id: 'FRAUD-103',
    userId: 'COMP-445',
    userName: 'Priya S.',
    userType: 'COMPANION',
    reason: 'DUPLICATE_ACCOUNT',
    severity: 'MEDIUM',
    status: 'PENDING',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: 'Device ID matches previously banned account BANNED-221.'
  }
];

export const fraudApi = {
  getAlerts: async (): Promise<FraudAlert[]> => {
    return [...mockAlerts];
  },
  
  updateAlertStatus: async (id: string, status: FraudAlert['status']): Promise<void> => {
    mockAlerts = mockAlerts.map(a => a.id === id ? { ...a, status } : a);
  }
};
