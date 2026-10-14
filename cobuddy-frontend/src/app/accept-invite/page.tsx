'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import axios from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AcceptInvitePage() {
  const [invite, setInvite] = useState({ id: '', token: '' });
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const id = params.get('id') || '';
    const token = params.get('token') || '';
    setInvite({ id, token });
    if (!id || !token)
      setError('Invalid invitation link. Ask your administrator for a new invitation.');
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !invite.id || !invite.token) return;
    setError('');
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    try {
      await axios.post(`/employees/${encodeURIComponent(invite.id)}/accept-invite`, {
        token: invite.token,
        password,
      });
      setComplete(true);
      setPassword('');
      setConfirmation('');
      setInvite({ id: '', token: '' });
      window.history.replaceState(null, '', '/accept-invite');
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Could not accept invitation. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-md space-y-6">
        <ShieldCheck aria-hidden="true" className="h-10 w-10 text-emerald-700" />
        <h1 className="text-2xl font-semibold">CoBuddy Admin</h1>
        {complete ? (
          <p role="status">Account activated. You can now sign in.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-lg font-medium">Accept invitation</h2>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <label htmlFor="invite-password">New password</label>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={64}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="invite-confirmation">Confirm password</label>
              <Input
                id="invite-confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={64}
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={pending || !invite.token || !invite.id}
            >
              {pending ? 'Activating...' : 'Activate account'}
            </Button>
          </form>
        )}
        <Link href="/login" className="inline-block text-sm underline">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
