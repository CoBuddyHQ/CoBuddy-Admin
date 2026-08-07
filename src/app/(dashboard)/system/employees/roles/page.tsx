'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoles } from '@/modules/system/employees/hooks/useRoles';
import { Trash2, Shield, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AVAILABLE_PERMISSIONS = [
  'READ_DISPUTES', 'RESOLVE_DISPUTES', 
  'MANAGE_USERS', 'VIEW_FINANCIALS', 
  'MANAGE_SETTINGS', 'MANAGE_ROLES'
];

export default function RolesPage() {
  const { roles, isLoading, addRole, deleteRole } = useRoles();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  if (isLoading) return <div className="p-6">Loading roles...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedPerms.length > 0) {
      addRole({ name, description, permissions: selectedPerms });
      setOpen(false);
      setName('');
      setDescription('');
      setSelectedPerms([]);
    }
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Admin Roles"
        description="Create and manage custom roles with granular permissions for your staff."
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Custom Roles</CardTitle>
              <CardDescription>Roles created manually with specific permission sets.</CardDescription>
            </div>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" /> Create Role
                </Button>
              } />
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create Custom Role</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Role Name</Label>
                    <Input placeholder="e.g. Content Moderator" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input placeholder="Brief description" value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {AVAILABLE_PERMISSIONS.map(perm => (
                        <label key={perm} className="flex items-center gap-2 text-sm border p-2 rounded cursor-pointer hover:bg-muted/50">
                          <input type="checkbox" checked={selectedPerms.includes(perm)} onChange={() => togglePerm(perm)} />
                          {perm.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={!name || selectedPerms.length === 0}>Save Role</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No custom roles found.
                  </TableCell>
                </TableRow>
              ) : roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={role.description}>
                    {role.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {role.permissions.slice(0, 3).map(p => (
                        <Badge key={p} variant="outline" className="text-[10px] uppercase">
                          {p.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => deleteRole(role.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
