import { IncidentSummary, IncidentDetail } from './types';

let mockIncidents: IncidentSummary[] = [
  { id: 'INC-001', type: 'Physical Harassment', involvedParties: ['UserA', 'CompB'], status: 'ESCALATED_LEGAL', legalEscalation: true, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'INC-002', type: 'Verbal Abuse', involvedParties: ['CompC', 'UserD'], status: 'OPEN', legalEscalation: false, timestamp: new Date().toISOString() },
];

let mockDetail: IncidentDetail = {
  ...mockIncidents[0],
  description: 'Companion reported that customer grabbed them forcefully during the movie.',
  evidence: ['sos_audio_123.mp3', 'chat_transcript_456.pdf'],
  investigatorNotes: [
    { timestamp: new Date(Date.now() - 80000000).toISOString(), note: 'Called companion to verify. Escalating to Legal.', author: 'Safety Officer Mike' }
  ],
  assignedInvestigator: 'Mike'
};

export const incidentsApi = {
  getIncidents: async (): Promise<IncidentSummary[]> => Promise.resolve([...mockIncidents]),
  getDetail: async (id: string): Promise<IncidentDetail> => {
    return Promise.resolve({ ...mockDetail, id });
  },
  updateStatus: async (id: string, status: any, note?: string, author?: string): Promise<void> => {
    const inc = mockIncidents.find(x => x.id === id);
    if (inc) {
      inc.status = status;
      if (status === 'ESCALATED_LEGAL') inc.legalEscalation = true;
    }
    if (note && author && id === mockDetail.id) {
      mockDetail.investigatorNotes.push({ timestamp: new Date().toISOString(), note, author });
      mockDetail.status = status;
      if (status === 'ESCALATED_LEGAL') mockDetail.legalEscalation = true;
    }
    return Promise.resolve();
  }
};
