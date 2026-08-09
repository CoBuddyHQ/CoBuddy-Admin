'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useReports } from '@/modules/moderation/reports/hooks/useReports';
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
            {reports.map(rep => (
              <TableRow key={rep.id}>
                <TableCell>{rep.id}</TableCell>
                <TableCell>{rep.category}</TableCell>
                <TableCell>{rep.reporterId}</TableCell>
                <TableCell>{rep.reportedUserId}</TableCell>
                <TableCell>{new Date(rep.timestamp).toLocaleDateString()}</TableCell>
                <TableCell>
                  {rep.assignedTo ? (
                    <span className="text-sm font-medium">{rep.assignedTo}</span>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => assignToMe({ id: rep.id, staffName: user.name || 'Admin' })}
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Assign to Me
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    rep.status === 'OPEN' ? 'destructive' : 
                    rep.status === 'INVESTIGATING' ? 'default' : 
                    rep.status === 'ESCALATED' ? 'outline' : 'secondary'
                  }>
                    {rep.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/moderation/reports/${rep.id}`)}>
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
