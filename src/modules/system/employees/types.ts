import { StaffRole } from '@/types/role.types';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: 'Trust & Safety' | 'Support' | 'Finance' | 'Legal' | 'Operations' | 'Engineering' | 'Management' | 'HR';
  reportingManagerId?: string;
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
  designation: string;
  department: Employee['department'];
  reportingManagerId?: string;
  roles: StaffRole[];
  cityScope?: string;
}

export interface UpdateEmployeeRolesPayload {
  roles: StaffRole[];
  cityScope?: string;
}
