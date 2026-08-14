import axios from '@/lib/api/client';
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
