'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useAuditLogs } from '@/modules/system/audit-logs/hooks/useAuditLogs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function AuditLogsPage() {
  const { logs, isLoading } = useAuditLogs();

  const listContent = (
    <div className="p-4">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>Admin</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Module</TableHeaderCell>
              <TableHeaderCell>Details</TableHeaderCell>
              <TableHeaderCell>IP Address</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map(l => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.timestamp).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{l.adminName} ({l.adminId})</TableCell>
                <TableCell>
                  <Badge variant="outline">{l.action}</Badge>
                </TableCell>
                <TableCell>{l.moduleAffected}</TableCell>
                <TableCell className="max-w-sm truncate" title={l.details}>{l.details}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">{l.ipAddress}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  return (
    <ListDetailTemplate
      title="Audit Logs & Admin Activity"
      description="Track every action taken by staff members for compliance and security."
      isDetailOpen={false}
      listContent={listContent}
    />
  );
}
