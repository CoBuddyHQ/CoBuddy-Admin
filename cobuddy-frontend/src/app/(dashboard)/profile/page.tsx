'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SecuritySettings } from '@/modules/auth/components/SecuritySettings';
import { hasPermission } from '@/lib/auth/permissions';
import { LoginHistoryCard } from '@/modules/system/audit-logs/components/LoginHistoryCard';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="My Profile"
        description="View your account details and security settings."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your personal information and assigned roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <div className="mt-1 font-medium">{user?.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <div className="mt-1 font-medium">{user?.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Assigned Roles</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary"
                    >
                      {role.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your security preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <SecuritySettings />
          </CardContent>
        </Card>

        {user && hasPermission(user.roles, 'audit-logs') && (
          <div className="md:col-span-2">
            <LoginHistoryCard employeeId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
