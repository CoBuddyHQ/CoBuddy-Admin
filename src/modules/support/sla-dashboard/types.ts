export interface SLAAlert {
  id: string;
  ticketId: string;
  agentName: string;
  category: string;
  priority: string;
  timeRemainingMs: number; // negative if breached
  status: 'WARNING' | 'BREACHED' | 'RESOLVED';
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  ticketsResolved: number;
  averageResolutionTimeMs: number;
  slaBreaches: number;
  activeTickets: number;
}
