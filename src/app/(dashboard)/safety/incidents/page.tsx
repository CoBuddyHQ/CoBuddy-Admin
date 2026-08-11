'use client';

import { ListDetailTemplate } from '@/components/templates/ListDetailTemplate';
import { useIncidents } from '@/modules/safety/incidents/hooks/useIncidents';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';
import { ShieldAlert } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function IncidentsPage() {
  const { incidents, isLoading } = useIncidents();
  const { incidentTypes } = useMasterData();
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
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Involved Parties</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Legal</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents.map(inc => (
              <TableRow key={inc.id}>
                <TableCell>{inc.id}</TableCell>
                <TableCell>
                  {incidentTypes.find(t => t.code === inc.type) ? getLocalizedText(incidentTypes.find(t => t.code === inc.type)!.label, 'en') : inc.type}
                </TableCell>
                <TableCell>{inc.involvedParties.join(' & ')}</TableCell>
                <TableCell>{new Date(inc.timestamp).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={
                    inc.status === 'OPEN' ? 'destructive' : 
                    inc.status === 'ESCALATED_LEGAL' ? 'default' : 'secondary'
                  }>
                    {inc.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {inc.legalEscalation && <ShieldAlert className="h-5 w-5 text-destructive" />}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/safety/incidents/${inc.id}`)}>
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
      title="Incident Center"
      description="Manage critical safety incidents and legal escalations."
      isDetailOpen={false}
      listContent={listContent}
    />
  );
}
