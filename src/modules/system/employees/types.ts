import { StaffRole } from '@/types/role.types';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: StaffRole[];
  cityScope?: string;
  status: 'active' | 'suspended';
  lastLogin?: string;
  twoFactorEnabled: boolean;
  inviteStatus: 'pending' | 'accepted';
}

export interface AddEmployeePayload {
  name: string;
  email: string;
  phone: string;
  roles: StaffRole[];
  cityScope?: string;
}

export interface UpdateEmployeeRolesPayload {
  roles: StaffRole[];
  cityScope?: string;
}
