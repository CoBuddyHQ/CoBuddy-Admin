'use client';
import { Component, type ReactNode } from 'react';
import { useQueryClient, useIsMutating } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

interface BoundaryProps {
  children: ReactNode;
  retry: () => Promise<void>;
}

interface BoundaryState {
  failed: boolean;
  retrying: boolean;
  error: Error | null;
}

class Boundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { failed: false, retrying: false, error: null };
  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { failed: true, error };
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="space-y-3 p-6 max-w-xl mx-auto my-12 bg-card rounded-lg border border-border">
        <h1 className="text-xl font-semibold">Unable to load this module</h1>
        <p className="text-sm text-muted-foreground">
          {this.state.error?.message || 'Check your connection and access permissions, then retry.'}
        </p>
        <div className="flex gap-3 pt-2">
          <Button
            disabled={this.state.retrying}
            onClick={async () => {
              this.setState({ retrying: true });
              try {
                await this.props.retry();
              } finally {
                this.setState({ failed: false, retrying: false, error: null });
              }
            }}
          >
            {this.state.retrying ? 'Retrying...' : 'Try again'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/login';
            }}
          >
            Sign in again
          </Button>
        </div>
      </div>
    );
  }
}
export function WorkflowBoundary({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const pending = useIsMutating({ predicate: (mutation) => mutation.meta?.workflow === true });
  return (
    <Boundary
      retry={async () => {
        await client.invalidateQueries();
        await client.resetQueries();
      }}
    >
      <fieldset disabled={pending > 0} className="contents" aria-busy={pending > 0}>
        {children}
      </fieldset>
      {pending > 0 && (
        <p role="status" className="text-sm">
          Saving changes...
        </p>
      )}
    </Boundary>
  );
}
