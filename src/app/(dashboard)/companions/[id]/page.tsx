'use client';

import { use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCompanions } from '@/modules/companions/hooks/useCompanions';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function CompanionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { companions, isLoading } = useCompanions();
  
  const companion = companions.find(c => c.id === id);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!companion) return <div className="p-6">Companion not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Companion: ${companion.name}`}
        description="Detailed view of companion profile and performance."
        action={
          <Link href="/companions" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            Back to Directory
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">ID</div>
              <div className="font-medium">{companion.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact</div>
              <div className="font-medium">{companion.email}<br/>{companion.phone}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={
                companion.status === 'ACTIVE' ? 'outline' : 
                companion.status === 'SUSPENDED' ? 'destructive' : 'secondary'
              }>
                {companion.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Verification</div>
              <Badge variant={
                companion.verificationStatus === 'VERIFIED' ? 'default' : 
                companion.verificationStatus === 'REJECTED' ? 'destructive' : 'secondary'
              }>
                {companion.verificationStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground">Trust Score</div>
                <div className="text-2xl font-bold">{companion.trustScore}</div>
              </div>
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground">Total Sessions</div>
                <div className="text-2xl font-bold">{companion.totalSessions}</div>
              </div>
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground">Earnings</div>
                <div className="text-2xl font-bold">₹{companion.totalEarnings.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
