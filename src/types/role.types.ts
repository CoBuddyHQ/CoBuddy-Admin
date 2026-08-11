export enum StaffRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  SAFETY_OPERATOR = 'SAFETY_OPERATOR',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  SUPPORT_LEAD = 'SUPPORT_LEAD',
  LEGAL_ADMIN = 'LEGAL_ADMIN',
  CITY_OPS_MANAGER = 'CITY_OPS_MANAGER',
  HR_ADMIN = 'HR_ADMIN'
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  roles: StaffRole[];
  cityScope?: string[]; // Used for CITY_OPS_MANAGER
  twoFactorEnabled?: boolean;
}
