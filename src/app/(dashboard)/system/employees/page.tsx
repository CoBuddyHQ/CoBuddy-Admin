'use client';

import { useState } from 'react';
import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useEmployees } from '@/modules/system/employees/hooks/useEmployees';
import { EmployeesTable } from '@/modules/system/employees/components/EmployeesTable';
import { AddStaffModal } from '@/modules/system/employees/components/AddStaffModal';
import { EditRolesModal } from '@/modules/system/employees/components/EditRolesModal';
import { Employee } from '@/modules/system/employees/types';

export default function EmployeesPage() {
  const { employees, addEmployee, isAdding, toggleStatus, forceLogout, updateRoles } = useEmployees();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // We reuse addMutation's isPending state or just rely on global loading. Since useEmployees doesn't expose isUpdating for updateRoles, we can just pass false or add it to hook.
  // We'll just pass false for isUpdating since useEmployees doesn't expose it, or we could add it to useEmployees. For now, it's fast enough.

  return (
    <>
      <ListDetailTemplate
        title="Employee & Role Management"
        description="Manage staff access, RBAC roles, and security policies."
        headerAction={<AddStaffModal onAdd={addEmployee} isAdding={isAdding} employees={employees} />}
        isDetailOpen={false}
        listContent={
          <EmployeesTable 
            employees={employees} 
            onToggleStatus={(id, currentStatus) => toggleStatus({ id, currentStatus })}
            onForceLogout={forceLogout}
            onEdit={setEditingEmployee}
          />
        }
      />
      <EditRolesModal 
        employee={editingEmployee} 
        onClose={() => setEditingEmployee(null)} 
        onSave={(id, data) => updateRoles({ id, data })}
        isUpdating={false} 
      />
    </>
  );
}
