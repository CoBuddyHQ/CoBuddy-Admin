'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useCompanionApplications } from '@/modules/companion-applications/hooks/useCompanionApplications';
import { CompanionApplicationsTable } from '@/modules/companion-applications/components/CompanionApplicationsTable';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';

export default function CompanionApplicationsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const { applications, meta, isLoading, isRefreshing, refresh } = useCompanionApplications(
    statusFilter,
    page,
  );
  const changeStatus = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <ListDetailTemplate
      title="Companion Applications"
      description="Manage onboarding pipeline for new companions."
      headerAction={
        <Button variant="outline" onClick={() => void refresh()} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      }
      listControls={
        <div className="flex flex-wrap gap-2">
          {[
            'PENDING',
            'IN_REVIEW',
            'INTERVIEW_SCHEDULED',
            'APPROVED',
            'REJECTED',
            'WAITLISTED',
            'ALL',
          ].map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'ghost'}
              size="sm"
              onClick={() => changeStatus(filter)}
            >
              {filter.replace('_', ' ')}
            </Button>
          ))}
        </div>
      }
      isDetailOpen={false}
      listContent={
        <div>
          {isLoading ? (
            <p role="status">Loading applications...</p>
          ) : applications.length === 0 ? (
            <div
              role="status"
              className="rounded-md border bg-background p-8 text-center space-y-3"
            >
              <h2 className="font-semibold">
                {statusFilter === 'ALL'
                  ? 'No applications on this page'
                  : 'No applications in this status'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'ALL'
                  ? 'New companion applications will appear here after they are submitted.'
                  : 'Choose another status to view the available applications.'}
              </p>
              {statusFilter !== 'ALL' && (
                <Button variant="outline" onClick={() => changeStatus('ALL')}>
                  Show all applications
                </Button>
              )}
            </div>
          ) : (
            <CompanionApplicationsTable
              applications={applications}
              onSelectApp={(id) => router.push(`/companion-applications/${id}`)}
            />
          )}
          <PaginationControls
            meta={meta}
            page={page}
            onPageChange={setPage}
            pending={isRefreshing}
          />
        </div>
      }
    />
  );
}
