import { ReviewItem } from './types';
import axios from '@/lib/api/client';

const mapReview = (item: any): ReviewItem => ({
  id: item.id,
  reviewerId: item.byCustomerId || item.byCompanionId,
  revieweeId: item.toCompanionId || item.toCustomerId,
  rating: item.rating,
  text: item.text ?? '',
  tags: item.tagCodes ?? [],
  flagReason: item.moderationNote,
  timestamp: item.createdAt,
  status: item.moderationStatus === 'PENDING' ? 'PENDING_REVIEW' : item.moderationStatus,
});

export const reviewsApi = {
  getReviews: async (): Promise<ReviewItem[]> => {
    const res = await axios.get('/moderation/reviews', { params: { page: 1, pageSize: 100 } });
    const items = res.data.data?.data ?? res.data.data ?? [];
    return items.map(mapReview);
  },
  moderateReview: async (
    id: string,
    action: 'APPROVE' | 'REMOVE',
    warning?: string,
  ): Promise<void> => {
    if (action === 'APPROVE') {
      await axios.post(`/moderation/reviews/${id}/approve`);
    } else {
      await axios.post(`/moderation/reviews/${id}/remove`, {
        reason: warning ?? 'Policy violation',
      });
    }
  },
};
