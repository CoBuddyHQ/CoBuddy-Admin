'use client';

import { useState } from 'react';
import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useVerificationQueue } from '@/modules/verification/hooks/useVerificationQueue';
import { VerificationQueueTable } from '@/modules/verification/components/VerificationQueueTable';
import { CaseDetailPanel } from '@/modules/verification/components/CaseDetailPanel';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS } from '@/modules/verification/constants';
import type { VerificationFilter } from '@/modules/verification/types';
import { hasPermission } from '@/lib/auth/permissions';
import { useAuthStore } from '@/store/authStore';

export default function VerificationQueuePage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<VerificationFilter>('PENDING_MANUAL_REVIEW');
  const [page, setPage] = useState(1);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const permitted = hasPermission(user?.roles ?? [], 'verification');
  const query = useVerificationQueue({ status: statusFilter, page, enabled: permitted });
  const selectedCase = !query.isError && query.cases.find((c) => c.id === selectedCaseId);
  const lastPage = Math.max(1, query.meta?.totalPages ?? page);
  if (!query.isFetching && !query.isError && page > lastPage) {
    setPage(lastPage);
    setSelectedCaseId(null);
  }
  if (!permitted) return <p role="alert">You do not have access to verification.</p>;

  return (
    <ListDetailTemplate
      title="Verification Queue"
      headerAction={
        <Button variant="outline" onClick={() => router.push('/verification/settings')}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      }
      listControls={
        <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
          <select
            aria-label="Verification status"
            value={statusFilter}
            className="h-9 min-w-0 max-w-full rounded-md border bg-background px-3 text-sm"
            onChange={(event) => {
              setStatusFilter(event.target.value as VerificationFilter);
              setPage(1);
              setSelectedCaseId(null);
            }}
          >
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh verification queue"
            title="Refresh verification queue"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      }
      isDetailOpen={!!selectedCase}
      listContent={
        <div className="min-w-0 space-y-4">
          {query.isError ? (
            <div role="alert" className="space-y-3 py-6">
              <p>Unable to load verification cases.</p>
              <Button
                variant="outline"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </div>
          ) : query.isPending ? (
            <p role="status" className="py-6">
              Loading verification cases...
            </p>
          ) : query.cases.length === 0 ? (
            <p role="status" className="py-6">
              No verification cases found.
            </p>
          ) : (
            <VerificationQueueTable
              cases={query.cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={setSelectedCaseId}
            />
          )}
          {!query.isError && query.meta && (
            <nav
              aria-label="Verification pagination"
              className="flex flex-wrap items-center justify-between gap-3 border-t py-3 text-sm"
            >
              <span>{query.meta.totalItems} cases</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous verification page"
                  title="Previous verification page"
                  disabled={query.isFetching || page <= 1}
                  onClick={() => {
                    setPage((value) => value - 1);
                    setSelectedCaseId(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span>
                  Page {page} of {Math.max(1, query.meta.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next verification page"
                  title="Next verification page"
                  disabled={query.isFetching || !query.meta.hasNext}
                  onClick={() => {
                    setPage((value) => value + 1);
                    setSelectedCaseId(null);
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      }
      detailPanel={
        selectedCase && (
          <CaseDetailPanel caseData={selectedCase} onClose={() => setSelectedCaseId(null)} />
        )
      }
    />
  );
}
