import { StaffRole } from '@/types/role.types';

type ModuleConfig = {
  roles: StaffRole[];
};

export const MODULE_PERMISSIONS: Record<string, ModuleConfig> = {
  'verification': { roles: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  'companion-applications': { roles: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  'trust-score': { roles: [StaffRole.SUPER_ADMIN, StaffRole.MODERATOR] },
  
  'flagged-chats': { roles: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  'reports': { roles: [StaffRole.MODERATOR] },
  'bans': { roles: [StaffRole.SUPER_ADMIN, StaffRole.MODERATOR] },
  'risk-scoring': { roles: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  'reviews': { roles: [StaffRole.MODERATOR] },
  'appeals': { roles: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  
  'sos-dashboard': { roles: [StaffRole.SAFETY_OPERATOR, StaffRole.SUPER_ADMIN] },
  'geofence': { roles: [StaffRole.SAFETY_OPERATOR] },
  'incidents': { roles: [StaffRole.SAFETY_OPERATOR, StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN] },
  'age-escalation': { roles: [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN] },
  'emergency-workflow': { roles: [StaffRole.SAFETY_OPERATOR] },
  
  'escrow': { roles: [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN] },
  'payouts': { roles: [StaffRole.FINANCE_ADMIN] },
  'refunds': { roles: [StaffRole.FINANCE_ADMIN] },
  'fraud-detection': { roles: [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN] },
  'tax-invoices': { roles: [StaffRole.FINANCE_ADMIN] },
  'revenue-reports': { roles: [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN] },
  'reconciliation': { roles: [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN] },
  
  'active-sessions': { roles: [StaffRole.SAFETY_OPERATOR, StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN] },
  'live-sessions': { roles: [StaffRole.SAFETY_OPERATOR, StaffRole.SUPER_ADMIN] },
  'booking-disputes': { roles: [StaffRole.FINANCE_ADMIN, StaffRole.SUPPORT_AGENT, StaffRole.SUPPORT_LEAD, StaffRole.SUPER_ADMIN] },
  'audit-logs-bookings': { roles: [StaffRole.SUPER_ADMIN, StaffRole.MODERATOR] },
  'customers': { roles: [StaffRole.SUPPORT_AGENT, StaffRole.SUPPORT_LEAD, StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  'companions': { roles: [StaffRole.SUPPORT_AGENT, StaffRole.SUPPORT_LEAD, StaffRole.MODERATOR, StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN] },
  
  'tickets': { roles: [StaffRole.SUPPORT_AGENT, StaffRole.SUPPORT_LEAD, StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  'sla-dashboard': { roles: [StaffRole.SUPPORT_AGENT, StaffRole.SUPPORT_LEAD, StaffRole.SUPER_ADMIN] },
  
  'ranking-config': { roles: [StaffRole.SUPER_ADMIN, StaffRole.CITY_OPS_MANAGER] },
  'city-launch': { roles: [StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN] },
  'venues': { roles: [StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN] },
  'growth-abuse': { roles: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN] },
  
  'master-data': { roles: [StaffRole.SUPER_ADMIN] },
  'training': { roles: [StaffRole.SAFETY_OPERATOR, StaffRole.SUPER_ADMIN] },
  'announcements': { roles: [StaffRole.SUPER_ADMIN, StaffRole.CITY_OPS_MANAGER] },
  'policy-docs': { roles: [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN] },
  
  'data-privacy': { roles: [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN] },
  'legal-requests': { roles: [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN] },
  
  'config': { roles: [StaffRole.SUPER_ADMIN] },
  'employees': { roles: [StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN] },
  'audit-logs': { roles: [StaffRole.SUPER_ADMIN] },
  'analytics-safety': { roles: [StaffRole.SAFETY_OPERATOR, StaffRole.SUPER_ADMIN] },
  'analytics-financial': { roles: [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN] },
  'analytics-operational': { roles: [StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN] },
  'analytics-growth': { roles: [StaffRole.SUPER_ADMIN, StaffRole.CITY_OPS_MANAGER] },
};

export const hasPermission = (userRoles: StaffRole[], moduleKey: string): boolean => {
  if (userRoles.includes(StaffRole.SUPER_ADMIN)) return true;
  
  const config = MODULE_PERMISSIONS[moduleKey];
  if (!config) return false;

  return userRoles.some(role => config.roles.includes(role));
};
