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

interface AddStaffModalProps {
  onAdd: (data: any) => void;
  isAdding: boolean;
}

export function AddStaffModal({ onAdd, isAdding }: AddStaffModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [cityScope, setCityScope] = useState('');

  const allRoles = Object.values(StaffRole);
  const showCityScope = roles.includes(StaffRole.CITY_OPS_MANAGER);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || roles.length === 0) return;
    
    onAdd({
      name,
      email,
      phone,
      roles,
      cityScope: showCityScope ? cityScope : undefined
    });
    setOpen(false);
    // Reset form
    setName(''); setEmail(''); setPhone(''); setRoles([]); setCityScope('');
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
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
