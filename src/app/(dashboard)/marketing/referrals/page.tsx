'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useReferrals } from '@/modules/marketing/referrals/hooks/useReferrals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function ReferralsPage() {
  const { config, leaderboard, isLoading, updateConfig, isUpdating } = useReferrals();
  
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (isLoading || !formData) return <div className="p-6">Loading Referrals...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Referral Program Admin" 
        description="Configure referral rewards and monitor top referrers."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Program Configuration</CardTitle>
            <CardDescription>Adjust amounts credited to wallets upon successful referral.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Program Status</Label>
                  <p className="text-sm text-muted-foreground">{formData.isActive ? 'Active' : 'Paused'}</p>
                </div>
                <Switch 
                  checked={formData.isActive} 
                  onCheckedChange={v => setFormData({ ...formData, isActive: v })} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referrer">Referrer Reward (₹)</Label>
                <Input 
                  id="referrer" 
                  type="number" 
                  min="0" 
                  value={formData.referrerRewardAmount} 
                  onChange={e => setFormData({ ...formData, referrerRewardAmount: Number(e.target.value) })} 
                />
                <p className="text-xs text-muted-foreground">Amount given to the person sharing the code.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referee">Referee Reward (₹)</Label>
                <Input 
                  id="referee" 
                  type="number" 
                  min="0" 
                  value={formData.refereeRewardAmount} 
                  onChange={e => setFormData({ ...formData, refereeRewardAmount: Number(e.target.value) })} 
                />
                <p className="text-xs text-muted-foreground">Amount given to the new user signing up.</p>
              </div>

              <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? 'Saving...' : 'Update Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
          <CardHeader>
            <CardTitle>Referral Leaderboard</CardTitle>
            <CardDescription>Top users by successful referrals.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>User ID</TableHeaderCell>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Total Referrals</TableHeaderCell>
                  <TableHeaderCell>Total Earned</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map(l => (
                  <TableRow key={l.userId}>
                    <TableCell>{l.userId}</TableCell>
                    <TableCell className="font-medium">{l.userName}</TableCell>
                    <TableCell>{l.totalReferrals}</TableCell>
                    <TableCell className="text-green-600 font-medium">{formatCurrency(l.totalEarned)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
