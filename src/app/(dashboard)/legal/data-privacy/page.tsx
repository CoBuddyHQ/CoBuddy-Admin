'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { usePrivacy } from '@/modules/legal/data-privacy/hooks/usePrivacy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PrivacyRequestsPage() {
  const { requests, isLoading, updateStatus, toggleLegalHold } = usePrivacy();

  if (isLoading) return <div className="">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Privacy & Deletion Requests"
        description="Process GDPR/DPDP-compliant data exports and account deletion requests."
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Requests</CardTitle>
          <CardDescription>Manage user data requests within the 30-day legal window.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium text-xs font-mono">{req.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{req.userName}</div>
                    <div className="text-xs text-muted-foreground">{req.userId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.requestType.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(req.requestDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(req.dueDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(req.dueDate), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={
                        req.status === 'FULFILLED' ? 'default' : 
                        req.status === 'REJECTED' ? 'secondary' : 'outline'
                      }>
                        {req.status}
                      </Badge>
                      {req.legalHold && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> Legal Hold
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => toggleLegalHold(req.id)}
                        title={req.legalHold ? "Remove Legal Hold" : "Apply Legal Hold (Blocks Deletion)"}
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </Button>
                      
                      {req.status === 'PENDING' && !req.legalHold && req.requestType === 'DATA_EXPORT' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus({ id: req.id, status: 'PROCESSING' })}
                          title="Generate Export"
                        >
                          <Download className="h-4 w-4 mr-1" /> Generate
                        </Button>
                      )}

                      {req.status === 'PENDING' && !req.legalHold && req.requestType === 'ACCOUNT_DELETION' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateStatus({ id: req.id, status: 'FULFILLED' })}
                          title="Confirm Hard Delete"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      )}

                      {req.status === 'PROCESSING' && !req.legalHold && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => updateStatus({ id: req.id, status: 'FULFILLED' })}
                          title="Mark Fulfilled"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Fulfill
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

