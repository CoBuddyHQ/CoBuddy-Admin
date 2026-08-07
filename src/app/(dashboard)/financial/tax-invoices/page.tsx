'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTaxInvoices } from '@/modules/financial/tax-invoices/hooks/useTaxInvoices';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle } from 'lucide-react';

export default function TaxInvoicesPage() {
  const { invoices, isLoading, updateStatus } = useTaxInvoices();

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax & Invoice Compliance"
        description="Manage Companion TDS deductions, GST details, and generate compliance invoices."
      />

      <Card>
        <CardHeader>
          <CardTitle>Invoice Directory</CardTitle>
          <CardDescription>Monthly tax statements and compliance tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Companion</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>TDS (10%)</TableHead>
                <TableHead>GST (18%)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.companionName}</div>
                    <div className="text-xs text-muted-foreground">PAN: {invoice.panNumber}</div>
                    {invoice.gstNumber && <div className="text-xs text-muted-foreground">GST: {invoice.gstNumber}</div>}
                  </TableCell>
                  <TableCell>{invoice.period}</TableCell>
                  <TableCell>₹{invoice.totalEarnings.toLocaleString()}</TableCell>
                  <TableCell>₹{invoice.tdsDeducted.toLocaleString()}</TableCell>
                  <TableCell>₹{invoice.gstCollected.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'COMPLIANT' ? 'default' : invoice.status === 'GENERATED' ? 'secondary' : 'outline'}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {invoice.status === 'PENDING' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus({ id: invoice.id, status: 'GENERATED' })}
                        >
                          Generate
                        </Button>
                      )}
                      {invoice.status === 'GENERATED' && (
                        <>
                          <Button variant="outline" size="sm" title="Download PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => updateStatus({ id: invoice.id, status: 'COMPLIANT' })}
                            title="Mark as Verified"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {invoice.status === 'COMPLIANT' && (
                        <Button variant="outline" size="sm" title="Download PDF">
                          <Download className="h-4 w-4" />
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
