'use client';

import { useState } from 'react';
import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useEmployees } from '@/modules/system/employees/hooks/useEmployees';
import { EmployeesTable } from '@/modules/system/employees/components/EmployeesTable';
import { AddStaffModal } from '@/modules/system/employees/components/AddStaffModal';
import { EditRolesModal } from '@/modules/system/employees/components/EditRolesModal';
import { Employee } from '@/modules/system/employees/types';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Button } from '@/components/ui/button';

export default function EmployeesPage() {
  const {
    employees,
    addEmployee,
    isAdding,
    toggleStatus,
    forceLogout,
    updateRoles,
    isUpdatingRoles,
    resendInvite,
    department,
    changeDepartment,
    meta,
    page,
    setPage,
    isLoading,
    isError,
    refetch,
  } = useEmployees(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  return (
    <>
      <ListDetailTemplate
        title="Employee & Role Management"
        description="Manage staff access, RBAC roles, and security policies."
        headerAction={
          <AddStaffModal onAdd={addEmployee} isAdding={isAdding} employees={employees} />
        }
        isDetailOpen={false}
        listContent={
          <>
            {isLoading ? (
              <p>Loading staff...</p>
            ) : isError ? (
              <div role="alert">
                Could not load staff. <Button onClick={() => void refetch()}>Retry</Button>
              </div>
            ) : (
              <EmployeesTable
                employees={employees}
                onToggleStatus={(id, currentStatus) => toggleStatus({ id, currentStatus })}
                onForceLogout={forceLogout}
                onEdit={setEditingEmployee}
                onResendInvite={resendInvite}
                department={department}
                onDepartmentChange={changeDepartment}
              />
            )}
            <PaginationControls
              meta={meta}
              page={page}
              onPageChange={setPage}
              pending={isLoading}
            />
          </>
        }
      />
      <EditRolesModal
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSave={(id, data) => updateRoles({ id, data })}
        isUpdating={isUpdatingRoles}
      />
    </>
  );
}
