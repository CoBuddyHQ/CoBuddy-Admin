'use client';

import { use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCustomerDetail } from '@/modules/customers/hooks/useCustomers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useReports } from '@/modules/moderation/reports/hooks/useReports';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { customer, bookingHistory, transactionHistory, isLoading, updateStatus } = useCustomerDetail(id);
  const { reports } = useReports();
  const customerReports = reports?.filter(r => r.reporterId === id || r.reportedUserId === id) || [];

  if (isLoading) return <div className="">Loading...</div>;
  if (!customer) return <div className="">Customer not found</div>;

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

      <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="bookings">Booking History</TabsTrigger>
          <TabsTrigger value="wallet">Wallet & Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports Filed</TabsTrigger>
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
                  <div className="font-medium">{customer.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{customer.name}</div>
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
                  <div className="text-sm text-muted-foreground">Join Date</div>
                  <div className="font-medium">{customer.joinDate}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Verification</div>
                  <Badge variant={customer.verificationStatus === 'VERIFIED' ? 'default' : customer.verificationStatus === 'REJECTED' ? 'destructive' : 'secondary'}>{customer.verificationStatus}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={customer.status === 'ACTIVE' ? 'outline' : customer.status === 'BANNED' ? 'destructive' : 'secondary'}>{customer.status}</Badge>
                  {customer.flags > 0 && (
                    <div className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <ShieldAlert className="h-3 w-3" /> {customer.flags} Flags
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>Past and upcoming bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Companion</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingHistory?.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>{booking.companionName}</TableCell>
                      <TableCell>{booking.activity}</TableCell>
                      <TableCell>{booking.venue}</TableCell>
                      <TableCell>
                        <Badge variant={booking.status === 'COMPLETED' ? 'default' : booking.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{booking.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="flex-1 overflow-auto pt-4">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Wallet Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Current Balance</div>
              <div className="text-3xl font-bold">₹{customer.walletBalance.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionHistory?.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'CREDIT' ? 'default' : 'secondary'}>{tx.type}</Badge>
                      </TableCell>
                      <TableCell className={tx.type === 'CREDIT' ? 'text-green-600 font-medium' : ''}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Reports filed by or against this customer.</CardDescription>
            </CardHeader>
            <CardContent>
              {customerReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No reports found for this customer.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerReports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell>{report.timestamp}</TableCell>
                        <TableCell>{report.reporterId === customer.id ? 'Filed by Customer' : 'Filed Against Customer'}</TableCell>
                        <TableCell>{report.category}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === 'OPEN' ? 'destructive' : report.status === 'RESOLVED' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="flex-1 overflow-auto pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Administrative actions for this customer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => updateStatus('ACTIVE')}
                  disabled={customer.status === 'ACTIVE'}
                >
                  Set Active
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => updateStatus('SUSPENDED')}
                  disabled={customer.status === 'SUSPENDED'}
                >
                  Suspend Account
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => updateStatus('BANNED')}
                  disabled={customer.status === 'BANNED'}
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
