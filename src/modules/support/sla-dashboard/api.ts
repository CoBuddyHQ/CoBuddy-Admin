import { SLAAlert, AgentPerformance } from './types';

let mockAlerts: SLAAlert[] = [
  {
    id: 'SLA-101',
    ticketId: 'TKT-10293',
    agentName: 'Alice',
    category: 'BILLING',
    priority: 'HIGH',
    timeRemainingMs: -1800000, // 30 minutes breached
    status: 'BREACHED'
  },
  {
    id: 'SLA-102',
    ticketId: 'TKT-10298',
    agentName: 'Bob',
    category: 'TECHNICAL',
    priority: 'URGENT',
    timeRemainingMs: 300000, // 5 minutes remaining
    status: 'WARNING'
  }
];

let mockPerformance: AgentPerformance[] = [
  {
    agentId: 'AGT-001',
    agentName: 'Alice',
    ticketsResolved: 45,
    averageResolutionTimeMs: 14400000, // 4 hours
    slaBreaches: 2,
    activeTickets: 5
  },
  {
    agentId: 'AGT-002',
    agentName: 'Bob',
    ticketsResolved: 38,
    averageResolutionTimeMs: 7200000, // 2 hours
    slaBreaches: 0,
    activeTickets: 3
  }
];

export const slaApi = {
  getAlerts: async (): Promise<SLAAlert[]> => {
    return [...mockAlerts];
  },

  getPerformance: async (): Promise<AgentPerformance[]> => {
    return [...mockPerformance];
  },
  
  reassignTicket: async (ticketId: string, newAgentName: string): Promise<void> => {
    mockAlerts = mockAlerts.map(a => a.ticketId === ticketId ? { ...a, agentName: newAgentName } : a);
  }
};
