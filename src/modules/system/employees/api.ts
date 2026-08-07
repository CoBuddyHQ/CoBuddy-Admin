import axios from '@/lib/api/client';
import { Employee, AddEmployeePayload, UpdateEmployeeRolesPayload } from './types';

// Mock data for development
let mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Admin User',
    email: 'admin@cobuddy.com',
    phone: '+91 9876543210',
    roles: ['SUPER_ADMIN' as any],
    status: 'active',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: true,
    inviteStatus: 'accepted'
  }
];

export const employeeApi = {
  getEmployees: async (): Promise<Employee[]> => {
    // return axios.get('/admin/employees').then(res => res.data);
    return Promise.resolve([...mockEmployees]);
  },
  
  addEmployee: async (data: AddEmployeePayload): Promise<Employee> => {
    // return axios.post('/admin/employees', data).then(res => res.data);
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      ...data,
      status: 'active',
      twoFactorEnabled: false,
      inviteStatus: 'pending'
    };
    mockEmployees.push(newEmp);
    return Promise.resolve(newEmp);
  },

  updateRoles: async (id: string, data: UpdateEmployeeRolesPayload): Promise<Employee> => {
    // return axios.put(`/admin/employees/${id}/roles`, data).then(res => res.data);
    const emp = mockEmployees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found');
    emp.roles = data.roles;
    emp.cityScope = data.cityScope;
    return Promise.resolve(emp);
  },

  toggleStatus: async (id: string, currentStatus: string): Promise<Employee> => {
    // return axios.post(`/admin/employees/${id}/toggle-status`).then(res => res.data);
    const emp = mockEmployees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found');
    emp.status = currentStatus === 'active' ? 'suspended' : 'active';
    return Promise.resolve(emp);
  },

  resendInvite: async (id: string): Promise<void> => {
    // return axios.post(`/admin/employees/${id}/resend-invite`).then(res => res.data);
    return Promise.resolve();
  },

  forceLogout: async (id: string): Promise<void> => {
    // return axios.post(`/admin/employees/${id}/force-logout`).then(res => res.data);
    return Promise.resolve();
  }
};
