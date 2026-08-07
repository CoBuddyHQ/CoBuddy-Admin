'use client';

import { use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCustomers } from '@/modules/customers/hooks/useCustomers';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { customers, isLoading } = useCustomers();
  
  const customer = customers.find(c => c.id === id);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!customer) return <div className="p-6">Customer not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Customer: ${customer.name}`}
        description="Detailed view of customer profile, wallet, and history."
        action={
          <Link href="/customers" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
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
              <div className="font-medium">{customer.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{customer.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="font-medium">{customer.phone}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={
                customer.status === 'ACTIVE' ? 'outline' : 
                customer.status === 'BANNED' ? 'destructive' : 'secondary'
              }>
                {customer.status}
              </Badge>
              {customer.flags > 0 && (
                <div className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <ShieldAlert className="h-3 w-3" /> {customer.flags} Flags
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Verification</div>
              <Badge variant={
                customer.verificationStatus === 'VERIFIED' ? 'default' : 
                customer.verificationStatus === 'REJECTED' ? 'destructive' : 'secondary'
              }>
                {customer.verificationStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity & Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground">Wallet Balance</div>
                <div className="text-2xl font-bold">₹{customer.walletBalance.toLocaleString()}</div>
              </div>
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground">Total Bookings</div>
                <div className="text-2xl font-bold">{customer.totalBookings}</div>
              </div>
              <div className="border rounded-md p-4 bg-muted/50">
                <div className="text-sm text-muted-foreground">Join Date</div>
                <div className="text-lg font-medium">{customer.joinDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
