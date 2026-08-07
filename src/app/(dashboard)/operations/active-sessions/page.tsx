'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useActiveSessions } from '@/modules/operations/active-sessions/hooks/useActiveSessions';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function ActiveSessionsPage() {
  const { sessions, isLoading } = useActiveSessions();

  const listContent = (
    <div className="p-4">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Session ID</TableHeaderCell>
              <TableHeaderCell>Companion</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Start Time</TableHeaderCell>
              <TableHeaderCell>Expected End</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.sessionId}</TableCell>
                <TableCell className="font-medium">{s.companionName}</TableCell>
                <TableCell>{s.userName}</TableCell>
                <TableCell>{s.location}</TableCell>
                <TableCell>{new Date(s.startTime).toLocaleTimeString()}</TableCell>
                <TableCell>{new Date(s.expectedEndTime).toLocaleTimeString()}</TableCell>
                <TableCell>
                  <Badge variant={s.status === 'EXTENDED' ? 'secondary' : s.status === 'ARRIVING' ? 'outline' : 'default'}>
                    {s.status}
                  </Badge>
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
      title="Active Sessions / Ongoing Bookings"
      description="Monitor all currently active bookings across the platform."
      isDetailOpen={false}
      listContent={listContent}
    />
  );
}
