import axios from '@/lib/api/client';
import { IncidentSummary, IncidentDetail } from './types';

const unwrap = (response: any) => response.data.data?.data ?? response.data.data;
const mapSummary = (item: any): IncidentSummary => ({
  id: item.id,
  type: item.incidentTypeCode,
  involvedParties: [...(item.involvedCustomerIds ?? []), ...(item.involvedCompanionIds ?? [])],
  status: item.status,
  legalEscalation: item.legalEscalation,
  timestamp: item.createdAt,
});
const mapDetail = (item: any): IncidentDetail => ({
  ...mapSummary(item),
  description: item.description,
  evidence: item.evidenceUrls ?? [],
  preserveEvidence: item.preserveEvidence,
  investigatorNotes: Array.isArray(item.investigatorNotes) ? item.investigatorNotes : [],
  assignedInvestigator: item.assignedInvestigatorId ?? undefined,
});

export const incidentsApi = {
  getIncidents: async (): Promise<IncidentSummary[]> => {
    const response = await axios.get('/safety/incidents');
    const value = unwrap(response) ?? [];
    return value.map(mapSummary);
  },
  getDetail: async (id: string): Promise<IncidentDetail> => {
    const response = await axios.get('/safety/incidents/' + id);
    return mapDetail(unwrap(response));
  },
  updateStatus: async (
    id: string,
    status: IncidentSummary['status'],
    note?: string,
    _author?: string,
  ): Promise<void> => {
    await axios.patch('/safety/incidents/' + id + '/status', { status, note });
  },
  togglePreserveEvidence: async (id: string): Promise<void> => {
    await axios.post('/safety/incidents/' + id + '/preserve-evidence/toggle');
  },
};
