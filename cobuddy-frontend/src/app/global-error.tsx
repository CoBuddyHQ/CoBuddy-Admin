'use client';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main role="alert" style={{ padding: '3rem', fontFamily: 'sans-serif' }}>
          <h1>Unable to load CoBuddy Admin</h1>
          <p>Please try again.</p>
          {error.digest && <p>Reference: {error.digest}</p>}
          <button onClick={retry}>Try again</button>
        </main>
      </body>
    </html>
  );
}
