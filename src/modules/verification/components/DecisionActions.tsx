import { useState } from 'react';
import { useSubmitDecision } from '../hooks/useSubmitDecision';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, RefreshCw } from 'lucide-react';

interface Props {
  caseId: string;
}

export function DecisionActions({ caseId }: Props) {
  const { submitDecision, isSubmitting } = useSubmitDecision();
  const [notes, setNotes] = useState('');

  const handleDecision = (decision: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION') => {
    submitDecision({ caseId, decision, notes });
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Manual Decision</h4>
      <Textarea 
        placeholder="Add notes for this decision... (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="text-sm"
      />
      <div className="grid grid-cols-3 gap-2">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white" 
          disabled={isSubmitting}
          onClick={() => handleDecision('APPROVE')}
        >
          <Check className="w-4 h-4 mr-2" /> Approve
        </Button>
        <Button 
          variant="destructive"
          disabled={isSubmitting}
          onClick={() => handleDecision('REJECT')}
        >
          <X className="w-4 h-4 mr-2" /> Reject
        </Button>
        <Button 
          variant="outline"
          disabled={isSubmitting}
          onClick={() => handleDecision('REQUEST_RESUBMISSION')}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Resubmit
        </Button>
      </div>
    </div>
  );
}
