'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReportDetail } from '@/modules/moderation/reports/hooks/useReports';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, FileText, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId as string;
  const { user } = useAuthStore();

  const { detail, isLoading, updateStatus, isUpdating, assignToMe } = useReportDetail(reportId);

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'INVESTIGATING' | 'RESOLVED' | 'ESCALATED'>('INVESTIGATING');
  const [note, setNote] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  if (isLoading || !detail) return <div className="p-6">Loading details...</div>;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatus({ status: newStatus, note, author: user?.name || 'System' });
    setIsNoteOpen(false);
    setNote('');
  };

  const openNoteDialog = (status: 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED') => {
    setNewStatus(status);
    setIsNoteOpen(true);
  };

  const isAssignedToMe = detail.assignedTo === user?.name;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push('/moderation/reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`Report: ${detail.id}`} 
          description={`Category: ${detail.category}`} 
          action={
            <div className="flex items-center gap-4">
              {!detail.assignedTo ? (
                <Button variant="outline" size="sm" onClick={() => assignToMe({ id: detail.id, staffName: user?.name || 'Unknown Staff' })}>
                  Assign to Me
                </Button>
              ) : (
                <div className="text-sm">
                  <span className="text-muted-foreground">Assigned to: </span>
                  <span className="font-medium">{isAssignedToMe ? 'You' : detail.assignedTo}</span>
                </div>
              )}
              {detail.status !== 'RESOLVED' ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openNoteDialog('INVESTIGATING')}>Mark Investigating</Button>
                  <Button variant="secondary" onClick={() => openNoteDialog('ESCALATED')}>Escalate</Button>
                  <Button variant="default" onClick={() => openNoteDialog('RESOLVED')}>Resolve</Button>
                </div>
              ) : (
                <Badge variant="secondary">Resolved</Badge>
              )}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Reporter:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" /> <span className="font-medium">{detail.reporterId}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Reported User:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-destructive" /> <span className="font-medium">{detail.reportedUserId}</span>
                  </div>
                </div>
                {detail.bookingId && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Related Booking:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4" /> <span className="font-medium text-primary cursor-pointer hover:underline">{detail.bookingId}</span>
                    </div>
                  </div>
                )}
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
              <CardTitle>Evidence</CardTitle>
              <CardDescription>Files attached by the reporter</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.evidenceUrls.length === 0 ? (
                <p className="text-sm text-muted-foreground">No evidence provided.</p>
              ) : (
                <div className="space-y-2">
                  {detail.evidenceUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-accent transition-colors">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate flex-1">{url.split('/').pop() || `Attachment ${i+1}`}</span>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEvidence(url)}>View</Button>
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
          <DialogHeader><DialogTitle>Update Report Status</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="flex items-center gap-2 mb-2 text-sm">
              New Status: <Badge variant="outline">{newStatus}</Badge>
            </div>
            <Textarea 
              placeholder="Add your investigation notes or reason..." 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              required 
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isUpdating}>Save & Update</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedEvidence !== null} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Evidence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedEvidence && (
              <div className="flex flex-col gap-4">
                <span className="text-sm font-medium break-all">{selectedEvidence.split('/').pop()}</span>
                <a href={selectedEvidence} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm">Open in new tab</a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
