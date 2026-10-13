export interface ReviewItem {
  id: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  text: string;
  tags: string[];
  flagReason?: string;
  timestamp: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REMOVED';
}
