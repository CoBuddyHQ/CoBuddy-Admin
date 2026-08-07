import { CompanionApplication } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/formatDate';
import { Check, X, Clock, UserCheck } from 'lucide-react';
import { useState } from 'react';

interface Props {
  application: CompanionApplication;
  onAssignToMe: () => void;
  isAssigning: boolean;
  onSubmitDecision: (decision: 'APPROVE' | 'REJECT' | 'WAITLIST', notes: string) => void;
  isSubmittingDecision: boolean;
}

export function ApplicationReviewView({ 
  application, 
  onAssignToMe, 
  isAssigning,
  onSubmitDecision,
  isSubmittingDecision
}: Props) {
  const [notes, setNotes] = useState('');

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Left Column: Details */}
      <div className="col-span-2 space-y-6 overflow-auto pb-8">
        <div className="bg-background rounded-md border p-6">
          <h2 className="text-xl font-bold mb-4">Applicant Profile</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{application.applicantName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact</p>
              <p className="font-medium">{application.email}<br/>{application.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">City</p>
              <p className="font-medium">{application.city}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date of Birth (Gender)</p>
              <p className="font-medium">{formatDate(application.dateOfBirth).split(',')[0]} ({application.gender})</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Bio / About Me</p>
              <p className="font-medium mt-1 p-3 bg-muted rounded-md">{application.bio}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-background rounded-md border p-6">
          <h2 className="text-xl font-bold mb-4">Trust & Verification</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-md border">
              <div>
                <p className="font-medium">Background Check</p>
                <p className="text-xs text-muted-foreground">Third-party criminal record check</p>
              </div>
              <Badge variant={application.backgroundCheckStatus === 'PASSED' ? 'default' : 'secondary'}>
                {application.backgroundCheckStatus}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted rounded-md border">
              <div>
                <p className="font-medium">Initial Trust Score</p>
                <p className="text-xs text-muted-foreground">Based on provided digital footprint</p>
              </div>
              <span className={`font-bold text-lg ${
                (application.trustScore || 0) >= 80 ? 'text-green-600' : 'text-orange-500'
              }`}>
                {application.trustScore || 'N/A'}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div className="space-y-6">
        <div className="bg-background rounded-md border p-6 shadow-sm sticky top-0">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Current Status</p>
            <Badge variant="outline" className="text-sm">
              {application.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Assignment</p>
            {application.assignedTo ? (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                <UserCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{application.assignedTo}</span>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={onAssignToMe}
                disabled={isAssigning}
              >
                Assign To Me
              </Button>
            )}
          </div>

          {application.status === 'IN_REVIEW' && (
            <div className="space-y-4 pt-6 border-t">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Final Decision</p>
              <Textarea 
                placeholder="Interview notes / Decision rationale..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-24"
              />
              <div className="space-y-2">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => onSubmitDecision('APPROVE', notes)}
                  disabled={isSubmittingDecision}
                >
                  <Check className="w-4 h-4 mr-2" /> Approve Companion
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => onSubmitDecision('WAITLIST', notes)}
                  disabled={isSubmittingDecision}
                >
                  <Clock className="w-4 h-4 mr-2" /> Add to Waitlist
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => onSubmitDecision('REJECT', notes)}
                  disabled={isSubmittingDecision}
                >
                  <X className="w-4 h-4 mr-2" /> Reject Application
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
