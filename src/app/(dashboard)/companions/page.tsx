'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useCompanions } from '@/modules/companions/hooks/useCompanions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Ban, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CompanionsPage() {
  const { companions, isLoading, updateStatus } = useCompanions();

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companion Directory"
        description="Manage companion profiles, onboarding status, and performance."
      />

      <Card>
        <CardHeader>
          <CardTitle>All Companions</CardTitle>
          <CardDescription>View performance, approve applications, or manage accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Companion</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companions.map((companion) => (
                <TableRow key={companion.id}>
                  <TableCell>
                    <Link href={`/companions/${companion.id}`} className="font-medium hover:underline text-primary">
                      {companion.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{companion.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{companion.email}</div>
                    <div className="text-xs text-muted-foreground">{companion.phone}</div>
                  </TableCell>
                  <TableCell>{companion.joinDate}</TableCell>
                  <TableCell>
                    <Badge variant={
                      companion.verificationStatus === 'VERIFIED' ? 'default' : 
                      companion.verificationStatus === 'REJECTED' ? 'destructive' : 'secondary'
                    }>
                      {companion.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{companion.trustScore}/100</div>
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${companion.trustScore >= 80 ? 'bg-green-500' : companion.trustScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${companion.trustScore}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{companion.totalSessions}</TableCell>
                  <TableCell>₹{companion.totalEarnings.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      companion.status === 'ACTIVE' ? 'outline' : 
                      companion.status === 'BANNED' ? 'destructive' : 'secondary'
                    }>
                      {companion.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {companion.status === 'ACTIVE' ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateStatus({ id: companion.id, status: 'SUSPENDED' })}
                          title="Suspend User"
                        >
                          <Ban className="h-4 w-4 mr-1" /> Suspend
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => updateStatus({ id: companion.id, status: 'ACTIVE' })}
                          title="Restore User"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Restore
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
