'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useReviews } from '@/modules/moderation/reviews/hooks/useReviews';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';
import { useState } from 'react';

export default function ReviewsPage() {
  const { reviews, isLoading: reviewsLoading, moderateReview } = useReviews();
  const { reviewTags, isLoading: masterDataLoading } = useMasterData();
  const [tagFilter, setTagFilter] = useState<string>('ALL');

  const filteredReviews = tagFilter === 'ALL' 
    ? reviews 
    : reviews.filter(r => r.tags.includes(tagFilter));

  const getTagBadge = (code: string) => {
    const tag = reviewTags.find(t => t.code === code);
    if (!tag) return <Badge key={code} variant="secondary">{code}</Badge>;
    const label = getLocalizedText(tag.label, 'en');
    return (
      <Badge key={code} variant={tag.polarity === 'PRAISE' ? 'default' : tag.polarity === 'CONCERN' ? 'destructive' : 'secondary'} className="mr-1 mt-1 text-xs">
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Reviews Moderation" 
        description="Review flagged ratings and comments."
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filter by Tag:</span>
            <Select value={tagFilter} onValueChange={(val) => setTagFilter(val as string)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tags</SelectItem>
                {reviewTags.map(t => (
                  <SelectItem key={t.code} value={t.code}>{getLocalizedText(t.label, 'en')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {reviewsLoading || masterDataLoading ? (
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
              {filteredReviews.map(r => (
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
                    <div className="min-w-[300px] max-w-md whitespace-normal">
                      <p className="text-sm font-medium leading-relaxed">{r.text}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.tags.map(getTagBadge)}
                      </div>
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

