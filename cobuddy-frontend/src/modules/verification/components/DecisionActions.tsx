import { useState } from 'react';
import { useSubmitDecision } from '../hooks/useSubmitDecision';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { DecisionPayload } from '../types';
import { isAxiosError } from 'axios';

interface Props {
  caseId: string;
}

export function DecisionActions({ caseId }: Props) {
  const { submitDecision, isSubmitting, error, reset } = useSubmitDecision();
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<DecisionPayload['decision'] | null>(null);
  const reasonRequired = decision !== 'APPROVE';
  const titles = {
    APPROVE: 'Approve verification',
    REJECT: 'Reject verification',
    REQUEST_RESUBMISSION: 'Request resubmission',
  };
  const openDecision = (value: DecisionPayload['decision']) => {
    reset();
    setDecision(value);
  };
  const message = isAxiosError(error) ? error.response?.data?.error?.message : undefined;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!decision || isSubmitting || (reasonRequired && notes.trim().length < 3)) return;
    try {
      await submitDecision({
        caseId,
        decision,
        notes: notes.trim() || undefined,
        reason: reasonRequired ? notes.trim() : undefined,
      });
      setDecision(null);
    } catch {
      // Preserve the review note and confirmation when the server refuses a decision.
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
        Manual Decision
      </h4>
      <div className="flex flex-wrap gap-2">
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isSubmitting}
          onClick={() => openDecision('APPROVE')}
        >
          <Check className="w-4 h-4 mr-2" /> Approve
        </Button>
        <Button
          variant="destructive"
          disabled={isSubmitting}
          onClick={() => openDecision('REJECT')}
        >
          <X className="w-4 h-4 mr-2" /> Reject
        </Button>
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => openDecision('REQUEST_RESUBMISSION')}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Resubmit
        </Button>
      </div>
      <Dialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) setDecision(null);
        }}
      >
        <DialogContent className="rounded-lg" showCloseButton={!isSubmitting}>
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{decision ? titles[decision] : 'Review decision'}</DialogTitle>
              <DialogDescription>
                {decision === 'APPROVE'
                  ? 'Confirm that the submitted identity evidence has been reviewed.'
                  : 'Record the reason for this decision.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="verification-decision-note">
                {reasonRequired ? 'Reason' : 'Review note (optional)'}
              </Label>
              <Textarea
                id="verification-decision-note"
                value={notes}
                required={reasonRequired}
                minLength={reasonRequired ? 3 : undefined}
                maxLength={500}
                disabled={isSubmitting}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {typeof message === 'string'
                  ? message
                  : 'Unable to save the decision. Please retry.'}
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting}
                onClick={() => setDecision(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (reasonRequired && notes.trim().length < 3)}
              >
                {isSubmitting ? 'Saving...' : 'Confirm decision'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
