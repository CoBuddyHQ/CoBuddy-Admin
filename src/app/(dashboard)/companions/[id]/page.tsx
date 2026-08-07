'use client';

import { use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCompanionDetail } from '@/modules/companions/hooks/useCompanions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default function CompanionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { companion, trustScoreHistory, sessionHistory, earnings, isLoading, updateStatus } = useCompanionDetail(id);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!companion) return <div className="p-6">Companion not found</div>;

  return (
    <div className="space-y-6 h-full flex flex-col p-6">
      <PageHeader
        title={`Companion: ${companion.name}`}
        description="Detailed view of companion profile and performance."
        action={
          <Link href="/companions" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            Back to Directory
          </Link>
        }
      />

      <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="profile">Profile & Verification</TabsTrigger>
          <TabsTrigger value="trust-score">Trust Score History</TabsTrigger>
          <TabsTrigger value="sessions">Session History</TabsTrigger>
          <TabsTrigger value="earnings">Earnings Breakdown</TabsTrigger>
          <TabsTrigger value="actions">Account Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-medium">{companion.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{companion.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{companion.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{companion.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={companion.status === 'ACTIVE' ? 'outline' : companion.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>{companion.status}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Verification</div>
                  <Badge variant={companion.verificationStatus === 'VERIFIED' ? 'default' : companion.verificationStatus === 'REJECTED' ? 'destructive' : 'secondary'}>{companion.verificationStatus}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trust-score" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Trust Score: {companion.trustScore}</CardTitle>
              <CardDescription>History of trust score changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Old Score</TableHead>
                    <TableHead>New Score</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trustScoreHistory?.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.oldScore}</TableCell>
                      <TableCell>{entry.newScore}</TableCell>
                      <TableCell>{entry.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Past bookings and sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Duration (mins)</TableHead>
                    <TableHead>Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionHistory?.map(session => (
                    <TableRow key={session.id}>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>{session.customerName}</TableCell>
                      <TableCell>{session.activity}</TableCell>
                      <TableCell>{session.durationMins}</TableCell>
                      <TableCell>₹{session.earnings}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Breakdown</CardTitle>
              <CardDescription>Financial summary of companion&apos;s earnings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-4 bg-muted/50">
                  <div className="text-sm text-muted-foreground">Base Earnings</div>
                  <div className="text-2xl font-bold">₹{earnings?.baseEarnings.toLocaleString()}</div>
                </div>
                <div className="border rounded-md p-4 bg-muted/50">
                  <div className="text-sm text-muted-foreground">Bonus Earnings</div>
                  <div className="text-2xl font-bold text-green-600">₹{earnings?.bonusEarnings.toLocaleString()}</div>
                </div>
                <div className="border rounded-md p-4 bg-muted/50">
                  <div className="text-sm text-muted-foreground">Platform Fee Deducted</div>
                  <div className="text-2xl font-bold text-destructive">₹{earnings?.platformFeeDeducted.toLocaleString()}</div>
                </div>
                <div className="border rounded-md p-4 bg-primary text-primary-foreground">
                  <div className="text-sm opacity-90">Total Net Earnings</div>
                  <div className="text-2xl font-bold">₹{earnings?.totalNet.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Administrative actions for this companion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => updateStatus('ACTIVE')}
                  disabled={companion.status === 'ACTIVE'}
                >
                  Set Active
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => updateStatus('SUSPENDED')}
                  disabled={companion.status === 'SUSPENDED'}
                >
                  Suspend Account
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => updateStatus('BANNED')}
                  disabled={companion.status === 'BANNED'}
                >
                  Ban Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
