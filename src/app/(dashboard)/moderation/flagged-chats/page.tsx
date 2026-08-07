'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useFlaggedChats } from '@/modules/moderation/flagged-chats/hooks/useFlaggedChats';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function FlaggedChatsPage() {
  const { chats, isLoading } = useFlaggedChats();
  const router = useRouter();

  const listContent = (
    <div className="p-4">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Participants</TableHeaderCell>
              <TableHeaderCell>Flag Reason</TableHeaderCell>
              <TableHeaderCell>AI Confidence</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chats.map(chat => (
              <TableRow key={chat.id}>
                <TableCell>{chat.id}</TableCell>
                <TableCell>{chat.participants.join(' & ')}</TableCell>
                <TableCell>{chat.flagReason}</TableCell>
                <TableCell>{(chat.confidenceScore * 100).toFixed(0)}%</TableCell>
                <TableCell>
                  <Badge variant={chat.status === 'PENDING' ? 'destructive' : 'secondary'}>
                    {chat.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/moderation/flagged-chats/${chat.id}`)}>
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <ListDetailTemplate
      title="Flagged Chat Review"
      description="Review AI-flagged conversations for inappropriate content or off-platform payment attempts."
      isDetailOpen={false}
      listContent={listContent}
    />
  );
}
