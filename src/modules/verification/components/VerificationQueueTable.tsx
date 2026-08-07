import { VerificationCase } from '../types';
import { STATUS_LABELS } from '../constants';
import { formatDate } from '@/lib/utils/formatDate';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

interface Props {
  cases: VerificationCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
}

export function VerificationQueueTable({ cases, selectedCaseId, onSelectCase }: Props) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>ID</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Auto-Check</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Submitted</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cases.map((c) => (
          <TableRow 
            key={c.id} 
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedCaseId === c.id ? 'bg-muted' : ''}`}
            onClick={() => onSelectCase(c.id)}
          >
            <TableCell className="font-medium">{c.id}</TableCell>
            <TableCell>{c.applicantName}</TableCell>
            <TableCell>{c.applicantType}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1 text-xs">
                <span>Face: {c.faceMatchScore}%</span>
                <span className={c.livenessPass ? 'text-green-600' : 'text-red-600'}>
                  Liveness: {c.livenessPass ? 'Pass' : 'Fail'}
                </span>
                <span className={c.documentValid ? 'text-green-600' : 'text-red-600'}>
                  Doc: {c.documentValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={
                c.status === 'APPROVED' || c.status === 'AUTO_APPROVED' ? 'default' :
                c.status === 'REJECTED' || c.status === 'AUTO_REJECTED' ? 'destructive' :
                'secondary'
              }>
                {STATUS_LABELS[c.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(c.submittedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
