'use client';

import { useTrustScores } from '@/modules/trust-score/hooks/useTrustScore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import { useRouter } from 'next/navigation';

export default function TrustScorePage() {
  const { summaries, rules, isLoading, toggleRule } = useTrustScores();
  const router = useRouter();

  if (isLoading) return <div className="">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Trust Score Engine" 
        description="Monitor companion trust scores, configure safety bonus rules, and manage manual overrides." 
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="shrink-0">
              <CardTitle>Companion Trust Scores</CardTitle>
              <CardDescription>Overall scores and statuses for all companions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Score</TableHeaderCell>
                    <TableHeaderCell>Action</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaries.map(item => (
                    <TableRow key={item.companionId}>
                      <TableCell>{item.companionId}</TableCell>
                      <TableCell>{item.companionName}</TableCell>
                      <TableCell>
                        <Badge variant={
                          item.status === 'EXCELLENT' ? 'default' : 
                          item.status === 'GOOD' ? 'secondary' : 
                          item.status === 'NEEDS_IMPROVEMENT' ? 'outline' : 'destructive'
                        }>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-lg">{item.currentScore}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/trust-score/${item.companionId}`)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Safety Bonus Rules</CardTitle>
              <CardDescription>Configure which events trigger a safety bonus payout.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium text-sm">{rule.description}</p>
                      <p className="text-xs text-muted-foreground">Bonus: {rule.bonusPoints} points</p>
                    </div>
                    <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule.id)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

