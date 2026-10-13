'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useCustomers } from '@/modules/customers/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Ban, CheckCircle } from 'lucide-react';

import Link from 'next/link';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useAuthStore } from '@/store/authStore';

export default function CustomersPage() {
  const { customers, isLoading, updateStatus, meta, page, setPage, isError, refetch } =
    useCustomers();
  const canManage = useAuthStore((state) =>
    state.user?.roles.some((role) => ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT_LEAD'].includes(role)),
  );

  if (isLoading) return <div className="">Loading...</div>;
  if (isError)
    return (
      <div role="alert">
        Could not load customers. <Button onClick={() => void refetch()}>Retry</Button>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="Search and manage all customer accounts across the platform."
      />

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            View profiles, verification status, and manage account access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Status / Flags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium hover:underline text-primary"
                    >
                      {customer.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{customer.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{customer.email}</div>
                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                  </TableCell>
                  <TableCell>{customer.joinDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.verificationStatus === 'VERIFIED'
                          ? 'default'
                          : customer.verificationStatus === 'REJECTED'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {customer.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.totalBookings}</TableCell>
                  <TableCell>₹{customer.walletBalance.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        variant={
                          customer.status === 'ACTIVE'
                            ? 'outline'
                            : customer.status === 'BANNED'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {customer.status}
                      </Badge>
                      {customer.flags > 0 && (
                        <div className="text-xs text-destructive flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> {customer.flags} Flags
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {canManage ? (
                        customer.status === 'ACTIVE' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateStatus({ id: customer.id, status: 'SUSPENDED' })}
                            title="Suspend User"
                          >
                            <Ban className="h-4 w-4 mr-1" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateStatus({ id: customer.id, status: 'ACTIVE' })}
                            title="Restore User"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Restore
                          </Button>
                        )
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {customers.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">No customers found.</p>
          )}
          <PaginationControls meta={meta} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
