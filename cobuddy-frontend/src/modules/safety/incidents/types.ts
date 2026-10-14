export interface IncidentSummary {
  id: string;
  type: string;
  involvedParties: string[];
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED_LEGAL' | 'CLOSED';
  legalEscalation: boolean;
  timestamp: string;
}

export interface IncidentDetail extends IncidentSummary {
  description: string;
  evidence: string[];
  preserveEvidence?: boolean;
  investigatorNotes: {
    timestamp: string;
    note: string;
    author: string;
  }[];
  assignedInvestigator?: string;
}
