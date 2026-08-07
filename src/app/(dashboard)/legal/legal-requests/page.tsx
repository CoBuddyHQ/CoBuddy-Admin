'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useLegalRequests } from '@/modules/legal/legal-requests/hooks/useLegalRequests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Lock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function LegalRequestsPage() {
  const { requests, isLoading, updateStatus } = useLegalRequests();

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Law-Enforcement Request Tracker"
        description="Log and manage incoming police, court, and third-party legal data requests."
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Subpoenas & Requests</CardTitle>
              <CardDescription>Track evidence preservation and response deadlines.</CardDescription>
            </div>
            <Button size="sm">Log New Request</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case / ID</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium text-xs font-mono">{req.id}</TableCell>
                  <TableCell className="font-medium">{req.agencyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.requestType.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{req.associatedUserName}</div>
                    <div className="text-xs text-muted-foreground">{req.associatedUserId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(req.deadline).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(req.deadline), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      req.status === 'CLOSED' ? 'secondary' : 
                      req.status === 'RESPONSE_SENT' ? 'default' : 
                      req.status === 'EVIDENCE_PRESERVED' ? 'outline' : 'destructive'
                    }>
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {req.status === 'OPEN' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus({ id: req.id, status: 'EVIDENCE_PRESERVED' })}
                          title="Lock Data"
                        >
                          <Lock className="h-4 w-4 mr-1" /> Preserve
                        </Button>
                      )}
                      
                      {req.status === 'EVIDENCE_PRESERVED' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => updateStatus({ id: req.id, status: 'RESPONSE_SENT' })}
                          title="Log Response Sent"
                        >
                          <Send className="h-4 w-4 mr-1" /> Respond
                        </Button>
                      )}

                      {req.status === 'RESPONSE_SENT' && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => updateStatus({ id: req.id, status: 'CLOSED' })}
                          title="Close Case"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Close
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm" title="View Docs">
                        <FileText className="h-4 w-4" />
                      </Button>
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
