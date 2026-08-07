'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useEmployees } from '@/modules/system/employees/hooks/useEmployees';
import { EmployeesTable } from '@/modules/system/employees/components/EmployeesTable';
import { AddStaffModal } from '@/modules/system/employees/components/AddStaffModal';

export default function EmployeesPage() {
  const { employees, addEmployee, isAdding, toggleStatus, forceLogout } = useEmployees();

  return (
    <ListDetailTemplate
      title="Employee & Role Management"
      description="Manage staff access, RBAC roles, and security policies."
      headerAction={<AddStaffModal onAdd={addEmployee} isAdding={isAdding} />}
      isDetailOpen={false}
      listContent={
        <EmployeesTable 
          employees={employees} 
          onToggleStatus={(id, currentStatus) => toggleStatus({ id, currentStatus })}
          onForceLogout={forceLogout}
        />
      }
    />
  );
}
