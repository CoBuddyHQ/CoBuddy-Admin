'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import { Employee } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, ShieldOff, KeyRound, Edit2, LogOut } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

interface EmployeesTableProps {
  employees: Employee[];
  onToggleStatus: (id: string, currentStatus: string) => void;
  onForceLogout: (id: string) => void;
  onEdit: (emp: Employee) => void;
}

export function EmployeesTable({ employees, onToggleStatus, onForceLogout, onEdit }: EmployeesTableProps) {
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

  const filteredEmployees = departmentFilter === 'All' 
    ? employees 
    : employees.filter(e => e.department === departmentFilter);

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Top Level';
    const manager = employees.find(e => e.id === managerId);
    return manager ? manager.name : 'Unknown';
  };

  if (employees.length === 0) {
    return <EmptyState title="No employees found" description="Add a staff member to get started." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 bg-background p-4 border rounded-md">
        <span className="text-sm font-medium">Filter by Department:</span>
        <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val as string)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {filteredEmployees.length === 0 ? (
        <EmptyState title="No employees match your filter" description="Try selecting a different department." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Employee</TableHeaderCell>
              <TableHeaderCell>Role(s)</TableHeaderCell>
              <TableHeaderCell>Department & Manager</TableHeaderCell>
              <TableHeaderCell>City Scope</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>2FA & Login</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="font-medium">
                    <Link href={`/system/employees/${emp.id}`} className="hover:underline text-primary">
                      {emp.name}
                    </Link>{' '}
                    <span className="text-muted-foreground text-xs font-normal">({emp.employeeId})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{emp.designation}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{emp.email} • {emp.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {emp.roles.map(r => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{emp.department}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Mgr: {getManagerName(emp.reportingManagerId)}</div>
                </TableCell>
                <TableCell>{emp.cityScope || '-'}</TableCell>
                <TableCell>
                  <Badge variant={emp.status === 'active' ? 'default' : 'destructive'}>
                    {emp.status}
                  </Badge>
                  {emp.inviteStatus === 'pending' && (
                    <Badge variant="outline" className="ml-1 mt-1 block w-fit">Pending Invite</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    {emp.twoFactorEnabled ? (
                      <span className="text-green-600 flex items-center"><KeyRound className="w-3 h-3 mr-1"/> 2FA Enabled</span>
                    ) : (
                      <span className="text-orange-500 flex items-center"><ShieldOff className="w-3 h-3 mr-1"/> 2FA Pending</span>
                    )}
                    <div className="text-muted-foreground mt-1">
                      {emp.lastLogin ? formatDate(emp.lastLogin) : 'Never'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(emp)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Roles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleStatus(emp.id, emp.status)}>
                        {emp.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onForceLogout(emp.id)} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" /> Force Logout All Sessions
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
