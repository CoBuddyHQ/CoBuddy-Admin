export interface AppealItem {
  id: string;
  userId: string;
  userName: string;
  originalBanReason: string;
  appealStatement: string;
  evidenceUrls?: string[];
  status: 'PENDING' | 'UPHELD' | 'REVERSED' | 'REDUCED_TO_WARNING';
  submittedAt: string;
}
