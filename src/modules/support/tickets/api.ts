import { SupportTicket } from './types';

let mockTickets: SupportTicket[] = [
  {
    id: 'TKT-10293',
    userId: 'USR-882',
    userName: 'Karan Malhotra',
    userType: 'CUSTOMER',
    category: 'payment_payout',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Double charged for session',
    thread: [
      { sender: 'USER', message: 'I was charged twice for the same booking!', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ],
    slaDeadline: new Date(Date.now() + 7200000).toISOString(),
    escalationLevel: 'L1',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'TKT-10294',
    userId: 'COMP-112',
    userName: 'Riya Sharma',
    userType: 'COMPANION',
    category: 'account_access',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    subject: 'Cannot update profile picture',
    thread: [
      { sender: 'USER', message: 'The app crashes when I try to upload a new selfie.', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { sender: 'SUPPORT', message: 'Hi Riya, could you let me know which app version you are on?', timestamp: new Date(Date.now() - 80000000).toISOString() }
    ],
    slaDeadline: new Date(Date.now() + 86400000).toISOString(),
    escalationLevel: 'L2',
    assignedTo: 'Admin User',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const ticketsApi = {
  getTickets: async (): Promise<SupportTicket[]> => {
    return [...mockTickets];
  },
  
  updateStatus: async (id: string, status: SupportTicket['status']): Promise<void> => {
    mockTickets = mockTickets.map(t => t.id === id ? { ...t, status } : t);
  },

  escalateTicket: async (id: string): Promise<void> => {
    mockTickets = mockTickets.map(t => {
      if (t.id === id) {
        const nextLevel = t.escalationLevel === 'L1' ? 'L2' : 'L3';
        return { ...t, escalationLevel: nextLevel };
      }
      return t;
    });
  },
  
  addReply: async (id: string, message: string): Promise<void> => {
    mockTickets = mockTickets.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          thread: [...t.thread, { sender: 'SUPPORT', message, timestamp: new Date().toISOString() }],
          status: 'IN_PROGRESS' 
        };
      }
      return t;
    });
  },

  assignToMe: async (id: string, staffName: string): Promise<void> => {
    mockTickets = mockTickets.map(t => {
      if (t.id === id) {
        return { ...t, assignedTo: staffName };
      }
      return t;
    });
  },

  reassignTicket: async (id: string, newStaffName: string): Promise<void> => {
    mockTickets = mockTickets.map(t => {
      if (t.id === id) {
        return { ...t, assignedTo: newStaffName };
      }
      return t;
    });
  }
};
