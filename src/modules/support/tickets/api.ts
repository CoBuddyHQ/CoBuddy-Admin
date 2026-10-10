import { unavailableFeature } from '@/lib/unavailable-feature';
import { SupportTicket } from './types';
export const ticketsApi = {
  getTickets: async (): Promise<SupportTicket[]> => {
    return unavailableFeature('support/tickets');
  },
  updateStatus: async (
    _id: string,
    _status: SupportTicket['status'],
    _resolutionNote?: string,
  ): Promise<void> => {
    return unavailableFeature('support/tickets');
  },
  escalateTicket: async (_id: string): Promise<void> => {
    return unavailableFeature('support/tickets');
  },
  addReply: async (_id: string, _message: string): Promise<void> => {
    return unavailableFeature('support/tickets');
  },
  assignToMe: async (_id: string, _staffName: string): Promise<void> => {
    return unavailableFeature('support/tickets');
  },
  reassignTicket: async (_id: string, _newStaffName: string): Promise<void> => {
    return unavailableFeature('support/tickets');
  },
};
