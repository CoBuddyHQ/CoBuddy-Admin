import { ReviewItem } from './types';

const mockReviews: ReviewItem[] = [
  { id: 'REV-001', reviewerId: 'UserX', revieweeId: 'CompY', rating: 1, text: 'Terrible experience, requested refund.', tags: ['Unprofessional'], flagReason: 'Contains personal attack', timestamp: new Date().toISOString(), status: 'PENDING_REVIEW' },
  { id: 'REV-002', reviewerId: 'CompZ', revieweeId: 'UserW', rating: 5, text: 'Great customer!', tags: ['Polite'], timestamp: new Date(Date.now() - 50000).toISOString(), status: 'APPROVED' },
];

export const reviewsApi = {
  getReviews: async (): Promise<ReviewItem[]> => Promise.resolve([...mockReviews]),
  moderateReview: async (id: string, action: 'APPROVE' | 'REMOVE', warning?: string): Promise<void> => {
    const r = mockReviews.find(x => x.id === id);
    if (r) {
      r.status = action === 'APPROVE' ? 'APPROVED' : 'REMOVED';
    }
    return Promise.resolve();
  }
};
