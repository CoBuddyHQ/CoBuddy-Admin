/**
 * IMPORTANT SECURITY NOTE:
 * This is a DEV-ONLY tool meant for quickly switching roles during prototyping.
 * It MUST be completely removed or strictly gated behind an environment check 
 * (e.g. process.env.NODE_ENV !== 'production') before any real production deployment.
 * Allowing users to arbitrarily assume any staff identity is a critical security vulnerability.
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { employeeApi } from '@/modules/system/employees/api';
import { Employee } from '@/modules/system/employees/types';
import { StaffUser } from '@/types/role.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function RoleSwitcher() {
  const { user, login } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Load mock employees
    employeeApi.getEmployees().then(setEmployees);
  }, []);

  const handleSwitch = async (employeeId: string | null) => {
    if (!employeeId) return;
    const matchedEmployee = employees.find(e => e.id === employeeId);
    if (!matchedEmployee) return;

    const staffUser: StaffUser = {
      id: matchedEmployee.id,
      name: matchedEmployee.name,
      email: matchedEmployee.email,
      roles: matchedEmployee.roles,
      cityScope: matchedEmployee.cityScope ? [matchedEmployee.cityScope] : undefined,
    };
    
    await employeeApi.updateLastLogin(staffUser.id);
    login(staffUser);
    
    // Optional reload to reset any local component states tied to previous role
    window.location.reload();
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Double safety check
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 p-2 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
      <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded">DEV</div>
      <div className="flex-1 min-w-[200px]">
        <Select value={user?.id || ''} onValueChange={handleSwitch}>
          <SelectTrigger className="h-8 text-xs bg-white dark:bg-black">
            <SelectValue placeholder="Switch Role..." />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp.id} value={emp.id} className="text-xs">
                {emp.name} ({emp.roles[0]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
