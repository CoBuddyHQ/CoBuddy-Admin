import axios from '@/lib/api/client';
import { SupportTicket } from './types';
export const ticketsApi = {
  getTickets: async (): Promise<SupportTicket[]> => {
    return (await axios.get('/support/tickets')).data.data;
  },
  getAgents: async (): Promise<{ id: string; name: string }[]> => {
    return (await axios.get('/support/agents')).data.data;
  },
  updateStatus: async (
    id: string,
    status: SupportTicket['status'],
    resolutionNote?: string,
  ): Promise<void> => {
    await axios.patch('/support/tickets/' + encodeURIComponent(id) + '/status', {
      status,
      resolutionNote,
    });
  },
  escalateTicket: async (id: string): Promise<void> => {
    await axios.post('/support/tickets/' + encodeURIComponent(id) + '/escalate');
  },
  addReply: async (id: string, message: string): Promise<void> => {
    await axios.post('/support/tickets/' + encodeURIComponent(id) + '/replies', { message });
  },
  assignToMe: async (id: string, _staffName?: string): Promise<void> => {
    await axios.post('/support/tickets/' + encodeURIComponent(id) + '/assign-self');
  },
  reassignTicket: async (id: string, staffId: string): Promise<void> => {
    await axios.patch('/support/tickets/' + encodeURIComponent(id) + '/assignment', {
      staffId: staffId || null,
    });
  },
};
