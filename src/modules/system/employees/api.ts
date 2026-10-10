import { Employee, AddEmployeePayload, UpdateEmployeeRolesPayload } from './types';
import axios from '@/lib/api/client';
import type { Paginated } from '@/types/pagination';

export const DEPARTMENTS: Record<Employee['department'], string> = {
  'Trust & Safety': 'TRUST_AND_SAFETY',
  Support: 'SUPPORT',
  Finance: 'FINANCE',
  Legal: 'LEGAL',
  Operations: 'OPERATIONS',
  Engineering: 'ENGINEERING',
  Management: 'MANAGEMENT',
  HR: 'HR',
};

const mapEmployee = (item: any): Employee => ({
  id: item.id,
  employeeId: item.employeeId,
  name: item.name,
  email: item.email,
  phone: item.phone,
  designation: item.designation,
  department:
    (Object.keys(DEPARTMENTS) as Employee['department'][]).find(
      (label) => DEPARTMENTS[label] === item.department,
    ) ?? item.department,
  reportingManagerId: item.reportingManagerId,
  roles: item.roles,
  cityScope: item.cityScopeIds?.[0],
  status: item.status === 'ACTIVE' ? 'active' : 'suspended',
  lastLogin: item.lastLoginAt,
  twoFactorEnabled: item.twoFactorEnabled,
  inviteStatus: item.inviteStatus === 'ACCEPTED' ? 'accepted' : 'pending',
  invitationDelivery: item.invitationDelivery,
});

export const employeeApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const employees: Employee[] = [];
    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const result = await employeeApi.getPage(page, 100);
      employees.push(...result.data);
      hasNext = result.meta.hasNext;
      page += 1;
    }
    return employees;
  },
  getPage: async (
    page = 1,
    pageSize = 20,
    department?: Employee['department'],
  ): Promise<Paginated<Employee>> => {
    const res = await axios.get('/employees', {
      params: { page, pageSize, department: department ? DEPARTMENTS[department] : undefined },
    });
    return { data: res.data.data.map(mapEmployee), meta: res.data.meta };
  },

  addEmployee: async (data: AddEmployeePayload): Promise<Employee> => {
    const res = await axios.post('/employees', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      designation: data.designation,
      department: DEPARTMENTS[data.department],
      roles: data.roles,
      cityScopeIds: data.cityScope ? [data.cityScope] : [],
      reportingManagerId: data.reportingManagerId,
    });
    return mapEmployee(res.data.data);
  },

  updateRoles: async (id: string, data: UpdateEmployeeRolesPayload): Promise<Employee> => {
    const res = await axios.patch(`/employees/${id}/roles`, {
      roles: data.roles,
      cityScopeIds: data.cityScope ? [data.cityScope] : [],
    });
    return mapEmployee(res.data.data);
  },

  toggleStatus: async (id: string, currentStatus: string): Promise<Employee> => {
    const newStatus = currentStatus === 'active' ? 'SUSPENDED' : 'ACTIVE';
    const res = await axios.patch(`/employees/${id}/status`, { status: newStatus });
    return mapEmployee(res.data.data);
  },

  updateLastLogin: async (_id: string): Promise<void> => {},

  resendInvite: async (id: string): Promise<Employee['invitationDelivery']> => {
    const result = await axios.post(`/employees/${encodeURIComponent(id)}/resend-invite`);
    return result.data.data.invitationDelivery;
  },

  forceLogout: async (id: string): Promise<void> => {
    await axios.post(`/employees/${id}/force-logout`);
  },
};
