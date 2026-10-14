export interface AgeEscalationCase {
  id: string;
  userId: string;
  userName: string;
  dobMismatchDetails: string;
  idEstimate: number | null;
  selfieEstimate: number | null;
  associatedRecordLink: string;
  status: 'PENDING_REVIEW' | 'FROZEN' | 'RESOLVED_CLEARED' | 'RESOLVED_BANNED';
  timestamp: string;
  resolutionNote?: string;
}
