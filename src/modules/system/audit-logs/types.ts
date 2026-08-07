export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  moduleAffected: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}
