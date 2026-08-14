import { AuditLog } from './types';

const mockLogs: AuditLog[] = [
  { id: 'AL-9012', adminId: 'ADM-01', adminName: 'Super Admin', action: 'UPDATE_CONFIG', moduleAffected: 'Matchmaking', details: 'Changed search radius to 25km', ipAddress: '192.168.1.10', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'AL-9011', adminId: 'ADM-02', adminName: 'Moderator 1', action: 'BAN_USER', moduleAffected: 'User Moderation', details: 'Banned user USR-99 for violation', ipAddress: '192.168.1.15', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'AL-9010', adminId: 'ADM-01', adminName: 'Super Admin', action: 'CREATE_COUPON', moduleAffected: 'Marketing', details: 'Created welcome coupon', ipAddress: '192.168.1.10', timestamp: new Date(Date.now() - 14400000).toISOString() },
];

export const auditLogsApi = {
  getLogs: async (): Promise<AuditLog[]> => Promise.resolve([...mockLogs]),
  logAction: async (log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> => {
    const newLog: AuditLog = {
      ...log,
      id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString()
    };
    mockLogs.unshift(newLog); // Add to beginning for newest-first
    return Promise.resolve(newLog);
  }
};
