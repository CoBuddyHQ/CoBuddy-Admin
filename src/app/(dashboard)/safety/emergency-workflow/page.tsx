'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEmergencyWorkflows } from '@/modules/safety/emergency-workflow/hooks/useEmergencyWorkflows';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Phone, ShieldAlert, CheckCircle } from 'lucide-react';

export default function EmergencyWorkflowPage() {
  const { workflows, isLoading, advanceStep, isAdvancing } = useEmergencyWorkflows();
  const { user } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWf, setSelectedWf] = useState<any>(null);
  const [nextStep, setNextStep] = useState<any>('');
  const [detail, setDetail] = useState('');

  if (isLoading) return <div className="">Loading...</div>;

  const handleAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWf) {
      advanceStep({ id: selectedWf.id, status: nextStep, detail, handler: user?.name || 'System' });
      setIsOpen(false);
      setDetail('');
    }
  };

  const openAdvanceDialog = (wf: any, step: string) => {
    setSelectedWf(wf);
    setNextStep(step);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Emergency Escalation Workflow" 
        description="Standard Operating Procedure (SOP) tracker for handling active SOS alerts."
      />

      <div className="grid grid-cols-1 gap-6 flex-1 overflow-y-auto">
        {workflows.length === 0 ? (
          <div className="text-center text-muted-foreground p-10 bg-muted rounded-md">No active emergency workflows.</div>
        ) : (
          workflows.map(wf => (
            <Card key={wf.id} className="border-l-4 border-l-destructive">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Workflow: {wf.id}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Related SOS: {wf.sosAlertId}</p>
                </div>
                <Badge variant="outline" className="text-lg py-1">{wf.status.replace(/_/g, ' ')}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Workflow Actions */}
                {wf.status !== 'RESOLVED' && (
                  <div className="flex flex-wrap gap-2 pt-2 pb-4 border-b border-dashed">
                    {wf.status === 'STEP_1_CONTACT_USER' && (
                      <Button onClick={() => openAdvanceDialog(wf, 'STEP_2_DISPATCH_AUTHORITIES')}>
                        <Phone className="w-4 h-4 mr-2" /> Advance to Step 2: Dispatch Authorities
                      </Button>
                    )}
                    {wf.status === 'STEP_2_DISPATCH_AUTHORITIES' && (
                      <Button onClick={() => openAdvanceDialog(wf, 'STEP_3_LEGAL_HOLD')} variant="destructive">
                        <ShieldAlert className="w-4 h-4 mr-2" /> Advance to Step 3: Legal Hold
                      </Button>
                    )}
                    {(wf.status === 'STEP_3_LEGAL_HOLD' || wf.status === 'STEP_2_DISPATCH_AUTHORITIES') && (
                      <Button onClick={() => openAdvanceDialog(wf, 'RESOLVED')} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                        <CheckCircle className="w-4 h-4 mr-2" /> Resolve Incident
                      </Button>
                    )}
                  </div>
                )}

                {/* Audit Log */}
                <div>
                  <h4 className="font-medium text-sm mb-3 text-muted-foreground">Audit Log</h4>
                  <div className="space-y-3">
                    {wf.log.map((l, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="w-24 shrink-0 text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{l.action}</p>
                          <p className="text-xs text-muted-foreground">Handled by: {l.handledBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Advance Workflow Step</DialogTitle></DialogHeader>
          <form onSubmit={handleAdvance} className="space-y-4 pt-4">
            <div className="flex items-center gap-2 mb-2 text-sm">
              Moving to: <Badge variant="outline">{nextStep.replace(/_/g, ' ')}</Badge>
            </div>
            <Textarea 
              placeholder="Action details (e.g. Called user, they are safe)..." 
              value={detail} 
              onChange={e => setDetail(e.target.value)} 
              required 
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isAdvancing}>Record & Advance</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

