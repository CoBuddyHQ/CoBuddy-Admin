import { Employee, AddEmployeePayload, UpdateEmployeeRolesPayload } from './types';

// Mock data for development
const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeId: 'EMP-001',
    name: 'Admin User',
    email: 'admin@cobuddy.com',
    phone: '+91 9876543210',
    designation: 'CTO',
    department: 'Management',
    roles: ['SUPER_ADMIN' as any],
    status: 'active',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
    inviteStatus: 'accepted'
  },
  {
    id: 'emp-2',
    employeeId: 'EMP-002',
    name: 'Support Lead',
    email: 'supportlead@cobuddy.com',
    phone: '+91 9876543211',
    designation: 'Support Manager',
    department: 'Support',
    reportingManagerId: 'emp-1',
    roles: ['SUPPORT_LEAD' as any],
    status: 'active',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
    inviteStatus: 'accepted'
  },
  {
    id: 'emp-3',
    employeeId: 'EMP-003',
    name: 'Junior Support',
    email: 'juniorsupport@cobuddy.com',
    phone: '+91 9876543212',
    designation: 'Support Agent',
    department: 'Support',
    reportingManagerId: 'emp-2',
    roles: ['SUPPORT_AGENT' as any],
    status: 'active',
    twoFactorEnabled: false,
    inviteStatus: 'pending'
  },
  {
    id: 'emp-4',
    employeeId: 'EMP-004',
    name: 'Moderator User',
    email: 'moderator@cobuddy.com',
    phone: '+91 9876543213',
    designation: 'Content Moderator',
    department: 'Trust & Safety',
    roles: ['MODERATOR' as any],
    status: 'active',
    twoFactorEnabled: false,
    inviteStatus: 'accepted'
  },
  {
    id: 'emp-5',
    employeeId: 'EMP-005',
    name: 'Safety Operator',
    email: 'safety@cobuddy.com',
    phone: '+91 9876543214',
    designation: 'Trust & Safety',
    department: 'Trust & Safety',
    roles: ['SAFETY_OPERATOR' as any],
    status: 'active',
    twoFactorEnabled: false,
    inviteStatus: 'accepted'
  },
  {
    id: 'emp-6',
    employeeId: 'EMP-006',
    name: 'Finance Admin',
    email: 'finance@cobuddy.com',
    phone: '+91 9876543215',
    designation: 'Finance Controller',
    department: 'Finance',
    roles: ['FINANCE_ADMIN' as any],
    status: 'active',
    twoFactorEnabled: false,
    inviteStatus: 'accepted'
  },
  {
    id: 'emp-7',
    employeeId: 'EMP-007',
    name: 'Legal Admin',
    email: 'legal@cobuddy.com',
    phone: '+91 9876543216',
    designation: 'Legal Counsel',
    department: 'Legal',
    roles: ['LEGAL_ADMIN' as any],
    status: 'active',
    twoFactorEnabled: false,
    inviteStatus: 'accepted'
  },
  {
    id: 'emp-8',
    employeeId: 'EMP-008',
    name: 'City Ops Manager',
    email: 'cityops@cobuddy.com',
    phone: '+91 9876543217',
    designation: 'Operations Manager',
    department: 'Operations',
    roles: ['CITY_OPS_MANAGER' as any],
    cityScope: 'CITY-1',
    status: 'active',
    twoFactorEnabled: false,
    inviteStatus: 'accepted'
  },
  {
    id: 'emp-9',
    employeeId: 'EMP-009',
    name: 'HR Admin',
    email: 'hr@cobuddy.com',
    phone: '+91 9876543218',
    designation: 'HR Manager',
    department: 'HR',
    roles: ['HR_ADMIN' as any],
    status: 'active',
    twoFactorEnabled: false,
    inviteStatus: 'accepted'
  }
];

export const employeeApi = {
  getEmployees: async (): Promise<Employee[]> => {
    return Promise.resolve([...mockEmployees]);
  },
  
  addEmployee: async (data: AddEmployeePayload): Promise<Employee> => {
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: `EMP-${(mockEmployees.length + 1).toString().padStart(3, '0')}`,
      ...data,
      status: 'active',
      twoFactorEnabled: false,
      inviteStatus: 'pending'
    };
    mockEmployees.push(newEmp);
    return Promise.resolve(newEmp);
  },

  updateRoles: async (id: string, data: UpdateEmployeeRolesPayload): Promise<Employee> => {
    const emp = mockEmployees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found');
    emp.roles = data.roles;
    emp.cityScope = data.cityScope;
    return Promise.resolve(emp);
  },

  toggleStatus: async (id: string, currentStatus: string): Promise<Employee> => {
    const emp = mockEmployees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found');
    emp.status = currentStatus === 'active' ? 'suspended' : 'active';
    return Promise.resolve(emp);
  },

  updateLastLogin: async (id: string): Promise<void> => {
    const emp = mockEmployees.find(e => e.id === id);
    if (emp) {
      emp.lastLogin = new Date().toISOString();
    }
    return Promise.resolve();
  },

  resendInvite: async (id: string): Promise<void> => {
    return Promise.resolve();
  },

  forceLogout: async (id: string): Promise<void> => {
    return Promise.resolve();
  }
};
