'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useReports } from '@/modules/moderation/reports/hooks/useReports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { reports, isLoading, assignToMe } = useReports();
  const router = useRouter();

  if (!user) return null;

  const listContent = (
    <div className="p-4">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Reporter</TableHeaderCell>
              <TableHeaderCell>Reported User</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Assignment</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((rep) => (
              <TableRow key={rep.id}>
                <TableCell className="font-mono text-xs">{rep.reportRef || rep.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{rep.category.toLowerCase()}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{rep.reporterName || 'Reporter'}</div>
                  <div className="text-xs text-muted-foreground font-mono">{rep.reporterId.slice(0, 8)}...</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{rep.reportedUserName || 'Reported User'}</span>
                    <Badge
                      variant={rep.reportedUserBanStatus === 'BANNED' ? 'destructive' : 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {rep.reportedUserBanStatus === 'BANNED' ? 'BANNED' : 'ACTIVE'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{rep.reportedUserId.slice(0, 8)}...</div>
                </TableCell>
                <TableCell>{new Date(rep.timestamp).toLocaleDateString()}</TableCell>
                <TableCell>
                  {rep.assignedTo ? (
                    <span className="text-sm font-medium">{rep.assignedTo}</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => assignToMe({ id: rep.id })}>
                      <UserPlus className="h-4 w-4 mr-1" /> Assign to Me
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      rep.status === 'OPEN'
                        ? 'destructive'
                        : rep.status === 'INVESTIGATING'
                          ? 'default'
                          : rep.status === 'ESCALATED'
                            ? 'outline'
                            : 'secondary'
                    }
                  >
                    {rep.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/moderation/reports/${rep.id}`)}
                  >
                    Investigate
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
      title="Reports & Complaints"
      description="Manage and investigate user reports and complaints."
      isDetailOpen={false}
      listContent={listContent}
    />
  );
}
