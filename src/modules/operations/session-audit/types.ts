export interface SessionAuditLog {
  id: string;
  sessionId: string;
  timestamp: string;
  action: string;
  actorType: 'SYSTEM' | 'CUSTOMER' | 'COMPANION' | 'ADMIN';
  actorId: string;
  details: string;
}

export interface SessionAuditFilters {
  sessionId?: string;
  dateRange?: { start: string; end: string };
}
