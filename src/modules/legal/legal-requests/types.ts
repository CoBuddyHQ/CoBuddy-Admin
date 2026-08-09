export interface LegalRequest {
  id: string;
  agencyName: string;
  requestType: 'SUBPOENA' | 'SUMMONS' | 'INFO_REQUEST' | 'WARRANT';
  associatedUserId: string;
  associatedUserName: string;
  status: 'OPEN' | 'EVIDENCE_PRESERVED' | 'RESPONSE_SENT' | 'CLOSED';
  deadline: string;
  receivedDate: string;
  internalNotes: string;
  documentUrls?: string[];
}
