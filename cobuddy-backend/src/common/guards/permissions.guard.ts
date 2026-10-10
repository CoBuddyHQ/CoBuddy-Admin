import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ALLOWED_FOR, IS_PUBLIC_KEY, ROLES_KEY } from '@/common/decorators/auth.decorators';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { StaffRole } from '@prisma/client';

export const MODULE_PERMISSIONS: Record<string, StaffRole[]> = {
  verification: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'companion-applications': [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'trust-score': [StaffRole.SUPER_ADMIN, StaffRole.MODERATOR],
  'verification.list': [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'companions.applications': [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'companions.list': [
    StaffRole.SUPPORT_AGENT,
    StaffRole.SUPPORT_LEAD,
    StaffRole.MODERATOR,
    StaffRole.FINANCE_ADMIN,
    StaffRole.SUPER_ADMIN,
  ],
  reports: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  bans: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'flagged-chats': [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'chat-settings': [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'risk-scoring': [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  reviews: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  appeals: [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],

  'sos-dashboard': [StaffRole.SAFETY_OPERATOR, StaffRole.SUPER_ADMIN],
  incidents: [StaffRole.SAFETY_OPERATOR, StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN],
  geofence: [StaffRole.SAFETY_OPERATOR],
  'age-escalation': [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN],
  'emergency-workflow': [StaffRole.SAFETY_OPERATOR],

  'finance.escrow': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  'finance.payouts': [StaffRole.FINANCE_ADMIN],
  'finance.refunds': [StaffRole.FINANCE_ADMIN],
  'finance.fraud-detection': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  'finance.tax-invoices': [StaffRole.FINANCE_ADMIN],
  'finance.revenue-reports': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  'finance.reconciliation': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  escrow: [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  payouts: [StaffRole.FINANCE_ADMIN],
  refunds: [StaffRole.FINANCE_ADMIN],
  'fraud-detection': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  'tax-invoices': [StaffRole.FINANCE_ADMIN],
  'revenue-reports': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  reconciliation: [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],

  'system.configs': [StaffRole.SUPER_ADMIN],
  'app-configs': [StaffRole.SUPER_ADMIN],
  config: [StaffRole.SUPER_ADMIN],
  'system.employees': [StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN],
  employees: [StaffRole.SUPER_ADMIN, StaffRole.HR_ADMIN],

  tickets: [
    StaffRole.SUPPORT_AGENT,
    StaffRole.SUPPORT_LEAD,
    StaffRole.MODERATOR,
    StaffRole.SUPER_ADMIN,
  ],
  'sla-dashboard': [StaffRole.SUPPORT_AGENT, StaffRole.SUPPORT_LEAD, StaffRole.SUPER_ADMIN],

  'ops.activeSessions': [
    StaffRole.SAFETY_OPERATOR,
    StaffRole.CITY_OPS_MANAGER,
    StaffRole.SUPER_ADMIN,
  ],
  'safety.liveSessions': [StaffRole.SAFETY_OPERATOR, StaffRole.SUPER_ADMIN],
  'ops.sessionAudit': [
    StaffRole.SAFETY_OPERATOR,
    StaffRole.CITY_OPS_MANAGER,
    StaffRole.SUPER_ADMIN,
  ],
  'ops.liveMap': [StaffRole.SAFETY_OPERATOR, StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN],
  'ops.completed': [StaffRole.SAFETY_OPERATOR, StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN],
  'ops.cancelled': [
    StaffRole.SAFETY_OPERATOR,
    StaffRole.CITY_OPS_MANAGER,
    StaffRole.FINANCE_ADMIN,
    StaffRole.SUPER_ADMIN,
  ],
  'ops.disputes': [
    StaffRole.FINANCE_ADMIN,
    StaffRole.SUPPORT_AGENT,
    StaffRole.SUPPORT_LEAD,
    StaffRole.SUPER_ADMIN,
  ],
  'audit-logs-bookings': [StaffRole.SUPER_ADMIN, StaffRole.MODERATOR],
  'customers.list': [
    StaffRole.SUPPORT_AGENT,
    StaffRole.SUPPORT_LEAD,
    StaffRole.MODERATOR,
    StaffRole.SUPER_ADMIN,
  ],
  'system.auditLogs': [StaffRole.SUPER_ADMIN],
  'system.masterData': [StaffRole.SUPER_ADMIN],
  'finance.fraud': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  customers: [
    StaffRole.SUPPORT_AGENT,
    StaffRole.SUPPORT_LEAD,
    StaffRole.MODERATOR,
    StaffRole.SUPER_ADMIN,
  ],
  companions: [
    StaffRole.SUPPORT_AGENT,
    StaffRole.SUPPORT_LEAD,
    StaffRole.MODERATOR,
    StaffRole.FINANCE_ADMIN,
    StaffRole.SUPER_ADMIN,
  ],

  'ranking-config': [StaffRole.SUPER_ADMIN, StaffRole.CITY_OPS_MANAGER],
  matchmaking: [StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN],
  events: [StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN],
  'city-launch': [StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN],
  venues: [StaffRole.CITY_OPS_MANAGER, StaffRole.SUPER_ADMIN],
  'growth-abuse': [StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],

  'master-data': [StaffRole.SUPER_ADMIN],
  notifications: [StaffRole.SUPER_ADMIN, StaffRole.CITY_OPS_MANAGER],
  training: [StaffRole.SAFETY_OPERATOR, StaffRole.SUPER_ADMIN],
  announcements: [StaffRole.SUPER_ADMIN, StaffRole.CITY_OPS_MANAGER],
  'policy-docs': [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN],

  'data-privacy': [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN],
  'legal-requests': [StaffRole.LEGAL_ADMIN, StaffRole.SUPER_ADMIN],

  'audit-logs': [StaffRole.SUPER_ADMIN],
  'analytics-safety': [StaffRole.SAFETY_OPERATOR, StaffRole.MODERATOR, StaffRole.SUPER_ADMIN],
  'analytics-financial': [StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN],
  'analytics-operational': [
    StaffRole.CITY_OPS_MANAGER,
    StaffRole.SUPPORT_AGENT,
    StaffRole.SUPPORT_LEAD,
    StaffRole.SUPER_ADMIN,
  ],
  'analytics-growth': [StaffRole.SUPER_ADMIN, StaffRole.CITY_OPS_MANAGER],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const explicitRoles = this.reflector.getAllAndOverride<StaffRole[]>(ROLES_KEY, targets);
    if (explicitRoles) {
      const roles: StaffRole[] = context.switchToHttp().getRequest().user?.roles || [];
      if (
        roles.includes(StaffRole.SUPER_ADMIN) ||
        roles.some((role) => explicitRoles.includes(role))
      )
        return true;
      throw new ForbiddenException('Role not authorized for this action');
    }

    const moduleConfig = this.reflector.getAllAndOverride<{ moduleKey: string }>(IS_ALLOWED_FOR, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!moduleConfig) {
      // If no module permission is specified, allow access (for backward compatibility)
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthStaffPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN has access to everything
    if (user.roles.includes(StaffRole.SUPER_ADMIN)) {
      return true;
    }

    const moduleKey = moduleConfig.moduleKey;
    const allowedRoles = MODULE_PERMISSIONS[moduleKey];

    if (!allowedRoles) {
      // If module is not defined in permissions, deny access
      throw new ForbiddenException(`Module '${moduleKey}' not found in permissions`);
    }

    const hasAccess = user.roles.some((role) => allowedRoles.includes(role as StaffRole));

    if (!hasAccess) {
      throw new ForbiddenException(`You don't have permission to access '${moduleKey}'`);
    }

    return true;
  }
}
