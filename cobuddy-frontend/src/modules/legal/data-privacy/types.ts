export interface PrivacyRequest {
  id: string;
  userId: string;
  userName: string;
  requestType: 'DATA_EXPORT' | 'ACCOUNT_DELETION';
  status: 'PENDING' | 'PROCESSING' | 'FULFILLED' | 'REJECTED';
  legalHold: boolean;
  requestDate: string;
  dueDate: string; // GDPR/Local law compliance timer usually 30 days
}
