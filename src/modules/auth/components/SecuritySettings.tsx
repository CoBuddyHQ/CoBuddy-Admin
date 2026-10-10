'use client';

import { useState } from 'react';
import { authApi, clearAuthSession } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function SecuritySettings() {
  const { user } = useAuthStore();
  const [qr, setQr] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      toast.error('Unable to complete the request. Check your details and try again.');
    } finally {
      setBusy(false);
      setPassword('');
    }
  }

  async function refreshProfile() {
    useAuthStore.getState().login(await authApi.me());
    setQr(null);
    setOtp('');
    setRemoving(false);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground">
              {user?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
            </p>
          </div>
          {!qr && !removing && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (user?.twoFactorEnabled) setRemoving(true);
                else
                  void run(async () => {
                    const response = await authApi.setup2FA();
                    setQr(response.data.data.qrcodeDataUrl);
                  });
              }}
            >
              {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          )}
        </div>
        {qr && (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await authApi.confirm2FA(otp);
                await refreshProfile();
                toast.success('Two-factor authentication enabled');
              });
            }}
          >
            <img
              src={qr}
              width={200}
              height={200}
              alt="Authenticator enrollment QR code"
              className="max-w-full"
            />
            <label className="block space-y-2">
              <span className="text-sm">Authenticator code</span>
              <Input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                disabled={busy}
              />
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                Confirm
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setQr(null);
                  setOtp('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
        {removing && (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await authApi.remove2FA(password);
                await refreshProfile();
                toast.success('Two-factor authentication disabled');
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm">Current password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={busy}
              />
            </label>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={busy}>
                Disable 2FA
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setRemoving(false);
                  setPassword('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>
      <section className="border-t pt-4 space-y-3">
        <h3 className="font-medium">Password</h3>
        <Button
          variant="outline"
          disabled={busy || !user?.email}
          onClick={() =>
            void run(async () => {
              await authApi.forgotPassword(user!.email);
              toast.success('Check your email for a password reset link');
            })
          }
        >
          Send password reset email
        </Button>
      </section>
      <section className="border-t pt-4 space-y-3">
        <h3 className="font-medium">Sessions</h3>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            if (window.confirm('Sign out of all sessions, including this one?'))
              void run(async () => {
                await authApi.logoutAll();
                clearAuthSession();
              });
          }}
        >
          Sign out everywhere
        </Button>
      </section>
    </div>
  );
}
