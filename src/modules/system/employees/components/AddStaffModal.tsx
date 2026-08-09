'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StaffRole } from '@/types/role.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee } from '../types';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';

interface AddStaffModalProps {
  onAdd: (data: any) => void;
  isAdding: boolean;
  employees: Employee[];
}

export function AddStaffModal({ onAdd, isAdding, employees }: AddStaffModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState<Employee['department']>('Support');
  const [reportingManagerId, setReportingManagerId] = useState<string>('none');
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [cityScope, setCityScope] = useState('');

  const { cities } = useMasterData();
  const activeCities = cities.filter(c => c.active);

  const allRoles = Object.values(StaffRole);
  const showCityScope = roles.includes(StaffRole.CITY_OPS_MANAGER);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !designation || !department || roles.length === 0) return;
    
    onAdd({
      name,
      email,
      phone,
      designation,
      department,
      reportingManagerId: reportingManagerId === 'none' ? undefined : reportingManagerId,
      roles,
      cityScope: showCityScope ? cityScope : undefined
    });
    setOpen(false);
    // Reset form
    setName(''); setEmail(''); setPhone(''); setDesignation(''); setDepartment('Support'); setReportingManagerId('none'); setRoles([]); setCityScope('');
  };

  const toggleRole = (role: StaffRole) => {
    setRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        Add Staff
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Input placeholder="Designation (e.g. Senior Agent)" value={designation} onChange={e => setDesignation(e.target.value)} required />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Department</label>
            <Select value={department} onValueChange={(value) => setDepartment(value as any)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Trust & Safety">Trust & Safety</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Reporting Manager</label>
            <Select value={reportingManagerId} onValueChange={(val) => setReportingManagerId(val as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top Level)</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Assign Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {allRoles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`role-${role}`} 
                    checked={roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <label htmlFor={`role-${role}`} className="text-xs">{role.replace('_', ' ')}</label>
                </div>
              ))}
            </div>
          </div>

          {showCityScope && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">City Scope</label>
              <Select value={cityScope} onValueChange={(value) => setCityScope(value as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {activeCities.map(city => (
                    <SelectItem key={city.id} value={city.name.en}>{city.name.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isAdding}>
              {isAdding ? 'Sending Invite...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
