import { CompanionApplication } from '../types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/formatDate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

interface Props {
  applications: CompanionApplication[];
  onSelectApp: (id: string) => void;
}

export function CompanionApplicationsTable({ applications, onSelectApp }: Props) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>ID</TableHeaderCell>
          <TableHeaderCell>Applicant</TableHeaderCell>
          <TableHeaderCell>City</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Assigned To</TableHeaderCell>
          <TableHeaderCell>Submitted</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {applications.map((app) => (
          <TableRow 
            key={app.id} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectApp(app.id)}
          >
            <TableCell className="font-medium text-xs">{app.id}</TableCell>
            <TableCell>
              <div>{app.applicantName}</div>
              <div className="text-xs text-muted-foreground">{app.phone}</div>
            </TableCell>
            <TableCell>{app.city}</TableCell>
            <TableCell>
              <Badge variant={
                app.status === 'APPROVED' ? 'default' :
                app.status === 'REJECTED' ? 'destructive' :
                app.status === 'IN_REVIEW' ? 'secondary' :
                'outline'
              }>
                {app.status.replace('_', ' ')}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {app.assignedTo || 'Unassigned'}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(app.submittedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
