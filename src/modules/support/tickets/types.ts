export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'REPORT' | 'OTHER';
export type EscalationLevel = 'L1' | 'L2' | 'L3';

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userType: 'CUSTOMER' | 'COMPANION';
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  thread: { sender: string; message: string; timestamp: string }[];
  slaDeadline: string;
  escalationLevel: EscalationLevel;
  createdAt: string;
}
