'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const response = await authApi.login(email, password);
      await finalizeLogin(response.data.data);
    } catch (error: any) {
      const details = error?.response?.data?.error?.details;
      if (details?.requires2fa && details.mfaToken) {
        setMfaToken(details.mfaToken);
        setStep('2FA');
        setPassword('');
        return;
      }
      if (!error?.response) {
        setError('Cannot connect to the admin server. Start the backend and try again.');
        return;
      }
      setError(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          'Invalid email or password',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (mfaToken) {
      setSubmitting(true);
      try {
        const response = await authApi.verify2FA(mfaToken, otp);
        await finalizeLogin(response.data.data);
      } catch (error: any) {
        setError(
          error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            'Invalid authentication code',
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  const resetMfa = () => {
    setStep('CREDENTIALS');
    setMfaToken(null);
    setOtp('');
    setError('');
  };

  const finalizeLogin = async (session: any) => {
    const user: StaffUser = {
      id: session.profile.id,
      name: session.profile.name,
      email: session.profile.email,
      roles: session.profile.roles,
      cityScope: session.profile.cityScope,
    };
    localStorage.setItem('admin_token', session.accessToken);
    if (session.refreshToken) localStorage.setItem('admin_refresh_token', session.refreshToken);
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
              : 'Enter the 6-digit code from your authenticator app'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">{error}</div>
          )}

          {step === 'CREDENTIALS' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cobuddy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => router.push('/forgot-password')}
                >
                  Forgot password?
                </Button>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="otp">
                  Authentication Code
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  disabled={submitting}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={resetMfa}
              >
                Use another account
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-xs text-muted-foreground text-center">Internal Operations Portal</p>
        </CardFooter>
      </Card>
    </div>
  );
}
