'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTickets } from '@/modules/support/tickets/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SupportTicket } from '@/modules/support/tickets/types';

export default function TicketsPage() {
  const { tickets, isLoading, updateStatus, escalateTicket, addReply } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  if (isLoading) return <div className="p-6">Loading...</div>;

  const handleReply = () => {
    if (selectedTicket && replyText.trim()) {
      addReply({ id: selectedTicket.id, message: replyText });
      setReplyText('');
      setSelectedTicket(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Manage customer and companion support inquiries, routing, and escalation."
      />

      <Card>
        <CardHeader>
          <CardTitle>Ticket Queue</CardTitle>
          <CardDescription>View, reply, and escalate active tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium text-xs font-mono">{ticket.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{ticket.userName}</div>
                    <Badge variant={ticket.userType === 'COMPANION' ? 'default' : 'secondary'} className="mt-1">
                      {ticket.userType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                  <TableCell><Badge variant="outline">{ticket.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={
                      ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'destructive' : 
                      ticket.priority === 'MEDIUM' ? 'default' : 'secondary'
                    }>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticket.escalationLevel}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      ticket.status === 'OPEN' ? 'destructive' : 
                      ticket.status === 'IN_PROGRESS' ? 'default' : 'secondary'
                    }>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                        title="View & Reply"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> View
                      </Button>
                      {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                        <>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => escalateTicket(ticket.id)}
                            disabled={ticket.escalationLevel === 'L3'}
                            title="Escalate"
                          >
                            <ArrowUpCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => updateStatus({ id: ticket.id, status: 'RESOLVED' })}
                            title="Mark Resolved"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ticket {selectedTicket?.id}</DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-md">
            {selectedTicket?.thread.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'SUPPORT' ? 'items-end' : 'items-start'}`}>
                <div className="text-xs text-muted-foreground mb-1">{msg.sender === 'SUPPORT' ? 'Agent' : selectedTicket.userName}</div>
                <div className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.sender === 'SUPPORT' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-4">
            <Textarea 
              placeholder="Type your reply here..." 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
              <Button onClick={handleReply} disabled={!replyText.trim()}>Send Reply</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
