export interface AgeEscalationCase {
  id: string;
  userId: string;
  userName: string;
  dobMismatchDetails: string;
  idEstimate: number;
  selfieEstimate: number;
  associatedRecordLink: string;
  status: 'PENDING_REVIEW' | 'FROZEN' | 'RESOLVED_CLEARED' | 'RESOLVED_BANNED';
  timestamp: string;
}
