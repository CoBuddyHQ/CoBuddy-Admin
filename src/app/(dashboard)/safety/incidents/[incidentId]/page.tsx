'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIncidentDetail } from '@/modules/safety/incidents/hooks/useIncidents';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, FileText, Image as ImageIcon, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.incidentId as string;
  const { user } = useAuthStore();

  const { detail, isLoading, updateStatus, isUpdating } = useIncidentDetail(incidentId);

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'INVESTIGATING' | 'ESCALATED_LEGAL' | 'CLOSED'>('INVESTIGATING');
  const [note, setNote] = useState('');

  if (isLoading || !detail) return <div className="p-6">Loading details...</div>;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatus({ status: newStatus, note, author: user?.name || 'System' });
    setIsNoteOpen(false);
    setNote('');
  };

  const openNoteDialog = (status: 'INVESTIGATING' | 'ESCALATED_LEGAL' | 'CLOSED') => {
    setNewStatus(status);
    setIsNoteOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push('/safety/incidents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`Incident: ${detail.id}`} 
          description={`Type: ${detail.type}`} 
          action={
            detail.status !== 'CLOSED' ? (
              <div className="flex gap-2">
                {detail.status !== 'INVESTIGATING' && <Button variant="outline" onClick={() => openNoteDialog('INVESTIGATING')}>Mark Investigating</Button>}
                <Button variant="destructive" onClick={() => openNoteDialog('ESCALATED_LEGAL')}>Escalate to Legal</Button>
                <Button variant="default" onClick={() => openNoteDialog('CLOSED')}>Close Incident</Button>
              </div>
            ) : (
              <Badge variant="secondary">Closed</Badge>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Incident Details</span>
                {detail.legalEscalation && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> LEGAL ESCALATION
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <span className="text-muted-foreground">Involved Parties:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detail.involvedParties.map((p, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-2">
                        <User className="h-3 w-3" /> {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Assigned Investigator:</span>
                  <div className="font-medium mt-1">{detail.assignedInvestigator || 'Unassigned'}</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">{detail.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="shrink-0 border-b pb-4">
              <CardTitle>Investigation Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {detail.investigatorNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes added yet.</p>
              ) : (
                detail.investigatorNotes.map((n, i) => (
                  <div key={i} className="border p-3 rounded-md bg-muted/50">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">{n.author}</span>
                      <span>{new Date(n.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{n.note}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Preserved</CardTitle>
              <CardDescription>Files attached and preserved for legal.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence provided.</p>
              ) : (
                <div className="space-y-2">
                  {detail.evidence.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate flex-1">{url}</span>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Incident Status</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="flex items-center gap-2 mb-2 text-sm">
              New Status: <Badge variant="outline">{newStatus}</Badge>
            </div>
            {newStatus === 'ESCALATED_LEGAL' && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 text-sm rounded-md mb-4 border border-red-200 dark:border-red-800">
                <strong>Warning:</strong> This will lock the incident for legal review and notify the Legal Admin.
              </div>
            )}
            <Textarea 
              placeholder="Add your investigation notes or reason..." 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              required 
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating} variant={newStatus === 'ESCALATED_LEGAL' ? 'destructive' : 'default'}>
                Save & Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
