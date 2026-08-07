'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useReviews } from '@/modules/moderation/reviews/hooks/useReviews';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function ReviewsPage() {
  const { reviews, isLoading, moderateReview } = useReviews();

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Reviews Moderation" 
        description="Review flagged ratings and comments."
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Reviewer</TableHeaderCell>
                <TableHeaderCell>Reviewee</TableHeaderCell>
                <TableHeaderCell>Rating</TableHeaderCell>
                <TableHeaderCell>Content</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.reviewerId}</TableCell>
                  <TableCell>{r.revieweeId}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                      {r.rating}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs whitespace-normal">
                      <p className="text-sm font-medium">{r.text}</p>
                      {r.flagReason && <p className="text-xs text-destructive mt-1">Flag: {r.flagReason}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'PENDING_REVIEW' ? 'destructive' : r.status === 'APPROVED' ? 'default' : 'secondary'}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.status === 'PENDING_REVIEW' && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => moderateReview({ id: r.id, action: 'APPROVE' })}>Approve</Button>
                        <Button variant="destructive" size="sm" onClick={() => moderateReview({ id: r.id, action: 'REMOVE' })}>Remove</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
