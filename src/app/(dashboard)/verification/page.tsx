'use client';

import { useState } from 'react';
import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useVerificationQueue } from '@/modules/verification/hooks/useVerificationQueue';
import { VerificationQueueTable } from '@/modules/verification/components/VerificationQueueTable';
import { CaseDetailPanel } from '@/modules/verification/components/CaseDetailPanel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VerificationQueuePage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  const { cases } = useVerificationQueue(statusFilter);
  const selectedCase = cases.find(c => c.id === selectedCaseId);

  return (
    <ListDetailTemplate
      title="Verification Queue"
      description="Review customer and companion ID verification cases."
      headerAction={
        <Button variant="outline" onClick={() => router.push('/verification/settings')}>
          <Settings className="w-4 h-4 mr-2" />
          Automation Settings
        </Button>
      }
      listControls={
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(filter => (
            <Button 
              key={filter} 
              variant={statusFilter === filter ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setStatusFilter(filter); setSelectedCaseId(null); }}
            >
              {filter === 'PENDING' ? 'Pending Manual Review' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      }
      isDetailOpen={!!selectedCase}
      listContent={
        <VerificationQueueTable 
          cases={cases}
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
        />
      }
      detailPanel={
        selectedCase && (
          <CaseDetailPanel 
            caseData={selectedCase} 
            onClose={() => setSelectedCaseId(null)}
          />
        )
      }
    />
  );
}
