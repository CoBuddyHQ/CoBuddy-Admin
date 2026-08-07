'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useCompanionApplications } from '@/modules/companion-applications/hooks/useCompanionApplications';
import { CompanionApplicationsTable } from '@/modules/companion-applications/components/CompanionApplicationsTable';
import { Button } from '@/components/ui/button';

export default function CompanionApplicationsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const { applications } = useCompanionApplications();
  
  const filteredApps = applications.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <ListDetailTemplate
      title="Companion Applications"
      description="Manage onboarding pipeline for new companions."
      listControls={
        <div className="flex gap-2">
          {['PENDING', 'IN_REVIEW', 'APPROVED', 'WAITLISTED', 'ALL'].map(filter => (
            <Button 
              key={filter} 
              variant={statusFilter === filter ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(filter)}
            >
              {filter.replace('_', ' ')}
            </Button>
          ))}
        </div>
      }
      isDetailOpen={false}
      listContent={
        <CompanionApplicationsTable 
          applications={filteredApps}
          onSelectApp={(id) => router.push(`/companion-applications/${id}`)}
        />
      }
    />
  );
}
