'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTrustScoreDetail } from '@/modules/trust-score/hooks/useTrustScore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/auth/permissions';

export default function TrustScoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const companionId = params.companionId as string;
  const { detail, isLoading, applyOverride, isOverriding } = useTrustScoreDetail(companionId);

  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [newScore, setNewScore] = useState('');
  const [reason, setReason] = useState('');

  const canOverride = user && hasPermission(user.roles, 'super-admin');

  if (isLoading || !detail) return <div className="">Loading details...</div>;

  const handleOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScore && reason && user) {
      applyOverride({ score: Number(newScore), reason, admin: user.name });
      setIsOverrideOpen(false);
      setNewScore('');
      setReason('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/trust-score')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`Trust Score: ${detail.companionName}`} 
          description={`Companion ID: ${detail.companionId}`} 
          action={
            canOverride ? (
              <Button onClick={() => setIsOverrideOpen(true)} variant="destructive">
                Manual Override
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall Score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{detail.currentScore}</div>
            <p className="text-xs text-muted-foreground mt-1">Status: {detail.status}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Punctuality</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{detail.punctualityScore}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{detail.completionRateScore}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Incidents</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{detail.incidentsScore}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Score History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detail.history.map((hist, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">Score: {hist.score}</p>
                    <p className="text-muted-foreground text-xs">{hist.reason}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(hist.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Manual Overrides</CardTitle></CardHeader>
          <CardContent>
            {detail.manualOverrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No manual overrides recorded.</p>
            ) : (
              <div className="space-y-4">
                {detail.manualOverrides.map((over, i) => (
                  <div key={i} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md text-sm border border-red-100 dark:border-red-900">
                    <div className="flex justify-between font-medium text-red-700 dark:text-red-400">
                      <span>Changed to {over.newScore} (from {over.previousScore})</span>
                      <span className="text-xs">{new Date(over.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-1">By: {over.overrideBy}</p>
                    <p className="mt-1 text-xs italic">&quot;{over.justification}&quot;</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Trust Score Override</DialogTitle></DialogHeader>
          <form onSubmit={handleOverride} className="space-y-4 pt-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm rounded-md mb-4 border border-yellow-200 dark:border-yellow-800">
              <strong>Warning:</strong> Manual overrides bypass the algorithmic calculation. This action will be logged in the audit trail.
            </div>
            <Input 
              type="number" 
              placeholder="New Score (0-100)" 
              value={newScore} 
              onChange={e => setNewScore(e.target.value)} 
              required 
              min="0" 
              max="100" 
            />
            <Textarea 
              placeholder="Justification for override" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              required 
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOverrideOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={isOverriding}>Apply Override</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
