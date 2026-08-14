'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTickets } from '@/modules/support/tickets/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, CheckCircle, MessageSquare, UserPlus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SupportTicket } from '@/modules/support/tickets/types';
import { useAuthStore } from '@/store/authStore';
import { StaffRole } from '@/types/role.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/modules/system/employees/hooks/useEmployees';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function TicketsPage() {
  const { user } = useAuthStore();
  const { tickets, isLoading, updateStatus, escalateTicket, addReply, assignToMe, reassignTicket } = useTickets();
  const { employees } = useEmployees();
  const { ticketCategories } = useMasterData();
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [teamView, setTeamView] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  const [resolutionTicket, setResolutionTicket] = useState<{ ticket: SupportTicket, status: 'RESOLVED' | 'CLOSED' } | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  if (isLoading || !user) return <div className="">Loading...</div>;

  const isLead = user.roles.includes(StaffRole.SUPPORT_LEAD);
  
  const filteredTickets = tickets.filter(ticket => {
    if (categoryFilter !== 'ALL' && ticket.category !== categoryFilter) return false;
    if (isLead && teamView) return true;
    return !ticket.assignedTo || ticket.assignedTo === user.name;
  });

  const supportStaff = employees.filter(e => 
    e.roles.includes(StaffRole.SUPPORT_AGENT) || e.roles.includes(StaffRole.SUPPORT_LEAD)
  );

  const handleReply = () => {
    if (selectedTicket && replyText.trim()) {
      addReply({ id: selectedTicket.id, message: replyText });
      setReplyText('');
      setSelectedTicket(null);
    }
  };

  const handleStatusChange = (ticket: SupportTicket, status: 'RESOLVED' | 'CLOSED') => {
    if (ticket.category === 'age_minor_escalation') {
      setResolutionTicket({ ticket, status });
      setResolutionNote('');
    } else {
      updateStatus({ id: ticket.id, status });
    }
  };

  const submitResolution = () => {
    if (resolutionTicket && resolutionNote.trim()) {
      updateStatus({ id: resolutionTicket.ticket.id, status: resolutionTicket.status, resolutionNote });
      setResolutionTicket(null);
      setResolutionNote('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Tickets"
        description="Manage customer and companion support inquiries, routing, and escalation."
        action={
          <div className="flex items-center gap-4">
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'ALL')}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Category Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {ticketCategories.filter(c => c.active).map(cat => (
                  <SelectItem key={cat.id} value={cat.code}>
                    {getLocalizedText(cat.label, 'en')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLead && (
              <div className="flex items-center space-x-2 bg-background p-2 border rounded-md">
                <Switch id="team-view" checked={teamView} onCheckedChange={setTeamView} />
                <Label htmlFor="team-view">Team View (All Tickets)</Label>
              </div>
            )}
          </div>
        }
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
                <TableHead>Assignment</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium text-xs font-mono">{ticket.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{ticket.userName}</div>
                    <Badge variant={ticket.userType === 'COMPANION' ? 'default' : 'secondary'} className="mt-1">
                      {ticket.userType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate font-medium">{ticket.subject}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Cat: {ticketCategories.find(c => c.code === ticket.category) ? getLocalizedText(ticketCategories.find(c => c.code === ticket.category)!.label, 'en') : ticket.category} | Lvl: {ticket.escalationLevel}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ticket.assignedTo ? (
                      <div className="text-sm font-medium">{ticket.assignedTo}</div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => assignToMe({ id: ticket.id, staffName: user.name || 'Admin' })}
                      >
                        <UserPlus className="h-4 w-4 mr-1" /> Assign to Me
                      </Button>
                    )}
                    {isLead && ticket.assignedTo && (
                      <div className="mt-2">
                        <Select 
                          value={ticket.assignedTo} 
                          onValueChange={(val) => reassignTicket({ id: ticket.id, newStaffName: val || '' })}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Reassign" />
                          </SelectTrigger>
                          <SelectContent>
                            {supportStaff.map(staff => (
                              <SelectItem key={staff.id} value={staff.name}>{staff.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'destructive' : 
                      ticket.priority === 'MEDIUM' ? 'default' : 'secondary'
                    }>
                      {ticket.priority}
                    </Badge>
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
                      {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' ? (
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
                            onClick={() => handleStatusChange(ticket, 'RESOLVED')}
                            title="Mark Resolved"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleStatusChange(ticket, 'CLOSED')}
                            title="Close Ticket"
                          >
                            Close
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus({ id: ticket.id, status: 'OPEN' })}
                          title="Reopen Ticket"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" /> Reopen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tickets found in this view.
                  </TableCell>
                </TableRow>
              )}
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

      <Dialog open={!!resolutionTicket} onOpenChange={(open) => !open && setResolutionTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Resolution Note</DialogTitle>
            <DialogDescription>
              Age/Minor Escalation tickets require a mandatory resolution note before they can be {resolutionTicket?.status.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              placeholder="Enter resolution details..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              required
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolutionTicket(null)}>Cancel</Button>
              <Button onClick={submitResolution} disabled={!resolutionNote.trim()}>
                {resolutionTicket?.status === 'CLOSED' ? 'Close Ticket' : 'Resolve Ticket'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

