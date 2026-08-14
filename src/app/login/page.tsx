'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { employeeApi } from '@/modules/system/employees/api';
import { auditLogsApi } from '@/modules/system/audit-logs/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { StaffUser } from '@/types/role.types';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');
  const [otp, setOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<StaffUser | null>(null);
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Note: Real password verification happens once a backend exists.
    // For now, we only check if the email exists in the mock employee list.
    const employees = await employeeApi.getEmployees();
    const matchedEmployee = employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());

    if (!matchedEmployee) {
      setError('Invalid email or password');
      return;
    }

    if (matchedEmployee.status === 'suspended') {
      setError('This account has been suspended. Contact your administrator.');
      return;
    }

    const staffUser: StaffUser = {
      id: matchedEmployee.id,
      name: matchedEmployee.name,
      email: matchedEmployee.email,
      roles: matchedEmployee.roles,
      cityScope: matchedEmployee.cityScope ? [matchedEmployee.cityScope] : undefined,
    };

    if (matchedEmployee.twoFactorEnabled) {
      setPendingUser(staffUser);
      setStep('2FA');
    } else {
      await finalizeLogin(staffUser);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    // Note: No real OTP verification yet. Accepting any 6 digits as valid.
    if (pendingUser) {
      await finalizeLogin(pendingUser);
    }
  };

  const finalizeLogin = async (user: StaffUser) => {
    await employeeApi.updateLastLogin(user.id);
    await auditLogsApi.logAction({
      adminId: user.id,
      adminName: user.name,
      action: 'LOGIN',
      moduleAffected: 'System',
      details: 'User logged in',
      ipAddress: '127.0.0.1' // Mock IP
    });
    login(user);
    router.replace('/');
  };

  if (isAuthenticated) return null; // Prevent flash while redirecting

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">CoBuddy Admin</CardTitle>
          <CardDescription>
            {step === 'CREDENTIALS' 
              ? 'Enter your credentials to access the admin panel'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}
          
          {step === 'CREDENTIALS' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@cobuddy.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">Password</label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="otp">Authentication Code</label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full">Verify & Sign In</Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-xs text-muted-foreground text-center">
            Internal Operations Portal
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
