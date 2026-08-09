'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaffRole } from '@/types/role.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Employee } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';

interface EditRolesModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: (id: string, data: { roles: StaffRole[], cityScope?: string }) => void;
  isUpdating: boolean;
}

export function EditRolesModal({ employee, onClose, onSave, isUpdating }: EditRolesModalProps) {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [cityScope, setCityScope] = useState('');

  const { cities } = useMasterData();
  const activeCities = cities.filter(c => c.active);
  const allRoles = Object.values(StaffRole);
  const showCityScope = roles.includes(StaffRole.CITY_OPS_MANAGER);

  useEffect(() => {
    if (employee) {
      setRoles(employee.roles);
      setCityScope(employee.cityScope || '');
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employee && roles.length > 0) {
      onSave(employee.id, {
        roles,
        cityScope: showCityScope ? cityScope : undefined
      });
      onClose();
    }
  };

  const toggleRole = (role: StaffRole) => {
    setRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Roles for {employee?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {allRoles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-role-${role}`} 
                    checked={roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <label htmlFor={`edit-role-${role}`} className="text-xs">{role.replace('_', ' ')}</label>
                </div>
              ))}
            </div>
          </div>

          {showCityScope && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">City Scope</label>
              <Select value={cityScope} onValueChange={(value: any) => setCityScope(value || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {activeCities.map(city => (
                    <SelectItem key={city.id} value={city.name.en || city.id}>{city.name.en || 'Unknown City'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isUpdating || roles.length === 0}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
