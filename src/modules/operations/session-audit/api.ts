import { SessionAuditLog, SessionAuditFilters } from './types';

const mockLogs: SessionAuditLog[] = [
  {
    id: 'LOG-001',
    sessionId: 'SES-998',
    timestamp: '2023-10-25T14:30:00Z',
    action: 'SESSION_STARTED',
    actorType: 'SYSTEM',
    actorId: 'SYS-01',
    details: 'Session officially started based on geofence entry.'
  },
  {
    id: 'LOG-002',
    sessionId: 'SES-998',
    timestamp: '2023-10-25T14:45:00Z',
    action: 'LOCATION_UPDATE',
    actorType: 'COMPANION',
    actorId: 'COMP-112',
    details: 'Location updated to 18.5204, 73.8567'
  },
  {
    id: 'LOG-003',
    sessionId: 'SES-998',
    timestamp: '2023-10-25T15:30:00Z',
    action: 'SESSION_COMPLETED',
    actorType: 'CUSTOMER',
    actorId: 'CUST-889',
    details: 'Customer marked session as completed via app.'
  }
];

export const sessionAuditApi = {
  getLogs: async (filters?: SessionAuditFilters): Promise<SessionAuditLog[]> => {
    let result = [...mockLogs];
    if (filters?.sessionId) {
      result = result.filter(log => log.sessionId.includes(filters.sessionId!));
    }
    return result;
  },
};
