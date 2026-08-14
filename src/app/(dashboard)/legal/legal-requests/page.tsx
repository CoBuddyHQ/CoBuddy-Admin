'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useLegalRequests } from '@/modules/legal/legal-requests/hooks/useLegalRequests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Lock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LegalRequestsPage() {
  const { requests, isLoading, updateStatus, createRequest } = useLegalRequests();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: '',
    requestType: 'INFO_REQUEST' as any,
    associatedUserId: '',
    associatedUserName: '',
    deadline: '',
    internalNotes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequest({
      ...formData,
      status: 'OPEN'
    });
    setOpen(false);
    setFormData({
      agencyName: '',
      requestType: 'INFO_REQUEST',
      associatedUserId: '',
      associatedUserName: '',
      deadline: '',
      internalNotes: ''
    });
  };

  const [selectedDocs, setSelectedDocs] = useState<string[] | null>(null);

  if (isLoading) return <div className="">Loading...</div>;

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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button size="sm">Log New Request</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Legal Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Agency Name</Label>
                    <Input required value={formData.agencyName} onChange={e => setFormData({ ...formData, agencyName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select value={formData.requestType} onValueChange={(v: any) => setFormData({ ...formData, requestType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INFO_REQUEST">Information Request</SelectItem>
                        <SelectItem value="SUBPOENA">Subpoena</SelectItem>
                        <SelectItem value="SUMMONS">Summons</SelectItem>
                        <SelectItem value="WARRANT">Warrant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target User ID</Label>
                      <Input required value={formData.associatedUserId} onChange={e => setFormData({ ...formData, associatedUserId: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Target User Name</Label>
                      <Input required value={formData.associatedUserName} onChange={e => setFormData({ ...formData, associatedUserName: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="datetime-local" required value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Input value={formData.internalNotes} onChange={e => setFormData({ ...formData, internalNotes: e.target.value })} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                      
                      <Button variant="outline" size="sm" title="View Docs" onClick={() => setSelectedDocs(req.documentUrls || [])}>
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

      <Dialog open={selectedDocs !== null} onOpenChange={(open) => !open && setSelectedDocs(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Attachments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {!selectedDocs || selectedDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents attached.</p>
            ) : (
              <ul className="space-y-2">
                {selectedDocs.map((url, i) => (
                  <li key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span className="truncate max-w-[250px]">{url.split('/').pop()}</span>
                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

