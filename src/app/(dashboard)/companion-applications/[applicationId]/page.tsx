'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCompanionApplicationDetail } from '@/modules/companion-applications/hooks/useCompanionApplications';
import { ApplicationReviewView } from '@/modules/companion-applications/components/ApplicationReviewView';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function CompanionApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.applicationId as string;
  const user = useAuthStore(s => s.user);
  
  const { 
    application, 
    isLoading, 
    assignToMe, 
    isAssigning,
    submitDecision,
    isSubmittingDecision
  } = useCompanionApplicationDetail(id);

  if (isLoading) return <div className="">Loading...</div>;
  if (!application) return <div className="">Application not found.</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <PageHeader 
        title={`Review Application: ${application.id}`}
        action={
          <Button variant="outline" onClick={() => router.push('/companion-applications')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Queue
          </Button>
        }
      />
      
      <div className="flex-1 min-h-0">
        <ApplicationReviewView 
          application={application}
          onAssignToMe={() => assignToMe(user?.name || 'Current User')}
          isAssigning={isAssigning}
          onSubmitDecision={(decision, notes) => submitDecision({ id, decision, notes })}
          isSubmittingDecision={isSubmittingDecision}
        />
      </div>
    </div>
  );
}
