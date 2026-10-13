'use client';
import { Component, type ReactNode } from 'react';
import { useQueryClient, useIsMutating } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

class Boundary extends Component<
  { children: ReactNode; retry: () => Promise<void> },
  { failed: boolean; retrying: boolean }
> {
  state = { failed: false, retrying: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Unable to load this module</h1>
        <p>Check your connection and access permissions, then retry.</p>
        <Button
          disabled={this.state.retrying}
          onClick={async () => {
            this.setState({ retrying: true });
            await this.props.retry();
            this.setState({ failed: false, retrying: false });
          }}
        >
          Try again
        </Button>
      </div>
    );
  }
}
export function WorkflowBoundary({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const pending = useIsMutating({ predicate: (mutation) => mutation.meta?.workflow === true });
  return (
    <Boundary
      retry={() => client.resetQueries({ predicate: (query) => query.meta?.workflow === true })}
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
