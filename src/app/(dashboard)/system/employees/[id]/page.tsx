'use client';

import { use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useEmployees } from '@/modules/system/employees/hooks/useEmployees';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { LoginHistoryCard } from '@/modules/system/audit-logs/components/LoginHistoryCard';
import { ShieldOff, KeyRound } from 'lucide-react';
import { EditRolesModal } from '@/modules/system/employees/components/EditRolesModal';
import { useState } from 'react';
import { Employee } from '@/modules/system/employees/types';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { employees, isLoading, toggleStatus, forceLogout, updateRoles, isUpdatingRoles } = useEmployees();
  const { cities } = useMasterData();
  const [isEditingRoles, setIsEditingRoles] = useState(false);

  if (isLoading) return <div className="">Loading...</div>;
  const employee = employees.find(e => e.id === id);
  if (!employee) return <div className="">Employee not found</div>;

  const cityName = employee.cityScope 
    ? cities.find((c: any) => c.id === employee.cityScope)?.name.en || employee.cityScope
    : 'Global / None';

  const reportingManager = employee.reportingManagerId 
    ? employees.find(e => e.id === employee.reportingManagerId)
    : null;

  const directReports = employees.filter(e => e.reportingManagerId === employee.id);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title={`Employee: ${employee.name}`}
        description="Detailed view of employee profile and access."
        action={
          <Link href="/system/employees" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            Back to Directory
          </Link>
        }
      />

      <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="profile">Profile & Access</TabsTrigger>
          <TabsTrigger value="chain">Reporting Chain</TabsTrigger>
          <TabsTrigger value="history">Login History</TabsTrigger>
          <TabsTrigger value="actions">Account Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Employee ID</div>
                  <div className="font-medium">{employee.employeeId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{employee.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{employee.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{employee.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Designation</div>
                  <div className="font-medium">{employee.designation}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Department</div>
                  <div className="font-medium">{employee.department}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">City Scope</div>
                  <div className="font-medium">{cityName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium mt-1">
                    <Badge variant={employee.status === 'active' ? 'default' : 'destructive'}>
                      {employee.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Invite Status</div>
                  <div className="font-medium mt-1">
                    <Badge variant="outline">{employee.inviteStatus}</Badge>
                  </div>
                </div>
                <div className="col-span-full">
                  <div className="text-sm text-muted-foreground mb-2">Assigned Roles</div>
                  <div className="flex flex-wrap gap-2">
                    {employee.roles.map(r => (
                      <Badge key={r} variant="secondary">
                        {r.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="col-span-full">
                  <div className="text-sm text-muted-foreground mb-1">Security</div>
                  <div className="text-sm">
                    {employee.twoFactorEnabled ? (
                      <span className="text-green-600 flex items-center"><KeyRound className="w-4 h-4 mr-1"/> 2FA Enabled</span>
                    ) : (
                      <span className="text-orange-500 flex items-center"><ShieldOff className="w-4 h-4 mr-1"/> 2FA Pending / Disabled</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chain" className="flex-1 overflow-auto pt-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Reporting Manager</CardTitle>
              <CardDescription>Who this employee reports to</CardDescription>
            </CardHeader>
            <CardContent>
              {reportingManager ? (
                <div className="flex flex-col">
                  <div className="font-medium text-lg">
                    <Link href={`/system/employees/${reportingManager.id}`} className="hover:underline text-primary">
                      {reportingManager.name}
                    </Link>{' '}
                    <span className="text-sm text-muted-foreground font-normal">({reportingManager.employeeId})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{reportingManager.designation}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">This employee does not report to anyone (Top Level).</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direct Reports</CardTitle>
              <CardDescription>Employees who report to this manager</CardDescription>
            </CardHeader>
            <CardContent>
              {directReports.length > 0 ? (
                <div className="space-y-4">
                  {directReports.map(report => (
                    <div key={report.id} className="flex flex-col border-b pb-3 last:border-0 last:pb-0">
                      <div className="font-medium">
                        <Link href={`/system/employees/${report.id}`} className="hover:underline text-primary">
                          {report.name}
                        </Link>{' '}
                        <span className="text-sm text-muted-foreground font-normal">({report.employeeId})</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{report.designation} • {report.department}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No employees report to this manager.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-auto pt-4">
          <LoginHistoryCard employeeId={employee.id} />
        </TabsContent>

        <TabsContent value="actions" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Administrative actions for this employee.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setIsEditingRoles(true)}
                >
                  Edit Roles
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => toggleStatus({ id: employee.id, currentStatus: employee.status })}
                >
                  {employee.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => forceLogout(employee.id)}
                >
                  Force Logout All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {isEditingRoles && (
        <EditRolesModal 
          employee={employee} 
          onClose={() => setIsEditingRoles(false)} 
          onSave={(empId, data) => updateRoles({ id: empId, data })}
          isUpdating={isUpdatingRoles} 
        />
      )}
    </div>
  );
}
