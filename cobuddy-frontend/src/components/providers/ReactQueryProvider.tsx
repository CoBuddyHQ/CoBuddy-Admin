'use client';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.options.onError) return;
            const data = isAxiosError(error) ? error.response?.data?.error : undefined;
            toast.error(
              Array.isArray(data?.details)
                ? data.details.join('; ')
                : data?.message || error.message || 'Could not save changes',
            );
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (count, error) => {
              const status = isAxiosError(error) ? error.response?.status : undefined;
              return count < 2 && (!status || status >= 500);
            },
          },
        },
      }),
  );

  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (
          state.user?.id !== previous.user?.id ||
          (previous.isAuthenticated && !state.isAuthenticated)
        ) {
          // Cached responses belong to the previous staff session.
          queryClient.clear();
        }
      }),
    [queryClient],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
