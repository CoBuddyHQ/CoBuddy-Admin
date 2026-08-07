'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFlaggedChatDetail } from '@/modules/moderation/flagged-chats/hooks/useFlaggedChats';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function FlaggedChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;

  const { detail, isLoading, takeAction, isActioning } = useFlaggedChatDetail(chatId);

  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'DISMISS' | 'WARN' | 'ESCALATE'>('DISMISS');
  const [notes, setNotes] = useState('');

  if (isLoading || !detail) return <div className="p-6">Loading details...</div>;

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    takeAction({ action: actionType, notes });
    setIsActionOpen(false);
  };

  const openAction = (type: 'DISMISS' | 'WARN' | 'ESCALATE') => {
    setActionType(type);
    setNotes('');
    setIsActionOpen(true);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push('/moderation/flagged-chats')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`Chat Review: ${detail.id}`} 
          description={`Participants: ${detail.participants.join(' & ')}`} 
          action={
            detail.status === 'PENDING' ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openAction('DISMISS')}>Dismiss</Button>
                <Button variant="secondary" onClick={() => openAction('WARN')}>Warn User</Button>
                <Button variant="destructive" onClick={() => openAction('ESCALATE')}>Escalate to Ban</Button>
              </div>
            ) : (
              <Badge>{detail.status}</Badge>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        
        <div className="md:col-span-2 flex flex-col h-full min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="shrink-0 border-b">
              <CardTitle>Chat Transcript (Masked)</CardTitle>
              <CardDescription>Flagged for: {detail.flagReason} (Confidence: {(detail.confidenceScore * 100).toFixed(0)}%)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {detail.messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === detail.participants[0] ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-muted-foreground mb-1">{msg.sender} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                  <div className={`p-3 rounded-lg max-w-[80%] ${msg.isFlagged ? 'bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-200' : 'bg-muted'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sender History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Previous Flags: {detail.senderHistory.previousFlags}</p>
                    <p className="text-sm text-muted-foreground">Times this user triggered AI filters</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Official Warnings: {detail.senderHistory.warnings}</p>
                    <p className="text-sm text-muted-foreground">Times moderator sent official warning</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>
            {actionType === 'DISMISS' ? 'Dismiss Flag' : actionType === 'WARN' ? 'Send Official Warning' : 'Escalate to Ban'}
          </DialogTitle></DialogHeader>
          <form onSubmit={handleAction} className="space-y-4 pt-4">
            <Textarea 
              placeholder="Internal notes for this action..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              required 
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsActionOpen(false)}>Cancel</Button>
              <Button type="submit" variant={actionType === 'DISMISS' ? 'default' : 'destructive'} disabled={isActioning}>
                Confirm Action
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
