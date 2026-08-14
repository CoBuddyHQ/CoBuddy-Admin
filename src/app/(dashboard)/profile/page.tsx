'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, ShieldAlert, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginHistoryCard } from '@/modules/system/audit-logs/components/LoginHistoryCard';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const twoFactorEnabled = user?.twoFactorEnabled || false;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
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
                  user.roles.map(role => (
                    <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
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
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {twoFactorEnabled ? <Shield className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    {twoFactorEnabled ? '2FA is active on your account.' : '2FA is not enabled.'}
                  </div>
                </div>
              </div>
              <Button variant="outline" disabled>Manage</Button>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-slate-100 text-slate-600">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-muted-foreground">
                      Update your account password.
                    </div>
                  </div>
                </div>
                <Button disabled>Update</Button>
              </div>
              <p className="mt-3 text-xs text-amber-600 font-medium">
                * Available once account system is connected.
              </p>
            </div>
          </CardContent>
        </Card>

        {user && (
          <div className="md:col-span-2">
            <LoginHistoryCard employeeId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
