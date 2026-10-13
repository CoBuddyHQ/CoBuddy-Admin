'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center"
      role="alert"
    >
      <h1 className="text-xl font-semibold">Unable to load this page</h1>
      <p>Please try again.</p>
      {error.digest && <p className="text-sm text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={retry}>Try again</Button>
    </div>
  );
}
