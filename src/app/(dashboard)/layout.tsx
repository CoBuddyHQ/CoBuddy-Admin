'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isRouteReleased } from '@/lib/release';
import { useAuthStore } from '@/store/authStore';
import { authApi, clearAuthSession } from '@/lib/api/client';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const handleAuthExpired = () => {
      useAuthStore.getState().logout();
      setSessionStatus('loading');
      router.replace('/login');
    };
    window.addEventListener('auth-expired', handleAuthExpired);

    if (!localStorage.getItem('admin_token') && !localStorage.getItem('admin_refresh_token')) {
      clearAuthSession();
    } else {
      // Persisted browser state is only a cache. Fetch the current staff profile
      // before mounting dashboard queries or showing any cached staff data.
      authApi
        .me()
        .then((user) => {
          if (cancelled) return;
          useAuthStore.getState().login(user);
          setSessionStatus('ready');
        })
        .catch(() => {
          if (cancelled) return;
          if (
            !localStorage.getItem('admin_token') &&
            !localStorage.getItem('admin_refresh_token')
          ) {
            handleAuthExpired();
          } else {
            setSessionStatus('error');
          }
        });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [attempt, router]);

  if (sessionStatus === 'error') {
    return (
      <div
        className="h-screen flex flex-col items-center justify-center gap-4 bg-background"
        role="alert"
      >
        <p>Unable to verify your session. Check your connection and try again.</p>
        <Button
          onClick={() => {
            setSessionStatus('loading');
            setAttempt((value) => value + 1);
          }}
        >
          Try again
        </Button>
        <Button variant="outline" onClick={clearAuthSession}>
          Back to sign in
        </Button>
      </div>
    );
  }

  if (sessionStatus !== 'ready' || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        Verifying your session...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 flex flex-col overflow-auto bg-muted/20 p-4 md:p-6">
          {isRouteReleased(pathname) ? (
            children
          ) : (
            <div className="space-y-3" role="status">
              <h1 className="text-xl font-semibold">Module unavailable</h1>
              <p className="text-muted-foreground">This module is not available in this release.</p>
              <Button variant="outline" onClick={() => router.back()}>
                Go back
              </Button>
            </div>
          )}
        </main>
      </div>
      {process.env.NODE_ENV !== 'production' && <RoleSwitcher />}
    </div>
  );
}
