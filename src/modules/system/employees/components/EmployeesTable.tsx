'use client';

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
import { MoreHorizontal, ShieldOff, KeyRound, Edit2, LogOut } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

interface EmployeesTableProps {
  employees: Employee[];
  onToggleStatus: (id: string, currentStatus: string) => void;
  onForceLogout: (id: string) => void;
}

export function EmployeesTable({ employees, onToggleStatus, onForceLogout }: EmployeesTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Role(s)</TableHeaderCell>
          <TableHeaderCell>City Scope</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>2FA & Login</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {employees.map((emp) => (
          <TableRow key={emp.id}>
            <TableCell>
              <div className="font-medium">{emp.name}</div>
              <div className="text-xs text-muted-foreground">{emp.email} • {emp.phone}</div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {emp.roles.map(r => (
                  <Badge key={r} variant="secondary" className="text-[10px]">
                    {r.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>{emp.cityScope || '-'}</TableCell>
            <TableCell>
              <Badge variant={emp.status === 'active' ? 'default' : 'destructive'}>
                {emp.status}
              </Badge>
              {emp.inviteStatus === 'pending' && (
                <Badge variant="outline" className="ml-1">Pending Invite</Badge>
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
                  <DropdownMenuItem>
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
  );
}
