'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useRiskScores } from '@/modules/moderation/risk-scoring/hooks/useRiskScores';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

export default function RiskScoringPage() {
  const { scores, isLoading, reclassify } = useRiskScores();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Risk Scoring Engine" 
        description="Monitor device fingerprints, GPS spoofing, and duplicate accounts."
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Risk Level</TableHeaderCell>
                <TableHeaderCell>Device Flags</TableHeaderCell>
                <TableHeaderCell>GPS Spoofs</TableHeaderCell>
                <TableHeaderCell>Duplicate Signals</TableHeaderCell>
                <TableHeaderCell>Last Updated</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scores.map(s => (
                <TableRow key={s.userId}>
                  <TableCell>
                    <div className="font-medium">{s.userName}</div>
                    <div className="text-xs text-muted-foreground">{s.userId}</div>
                  </TableCell>
                  <TableCell>{s.userType}</TableCell>
                  <TableCell>
                    <Badge variant={
                      s.riskLevel === 'CRITICAL' ? 'destructive' : 
                      s.riskLevel === 'HIGH' ? 'destructive' : 
                      s.riskLevel === 'MEDIUM' ? 'outline' : 'secondary'
                    }>
                      {s.riskLevel === 'CRITICAL' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {s.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.deviceFlags > 0 ? <span className="text-red-500 font-bold">{s.deviceFlags}</span> : s.deviceFlags}</TableCell>
                  <TableCell>{s.gpsSpoofFlags > 0 ? <span className="text-red-500 font-bold">{s.gpsSpoofFlags}</span> : s.gpsSpoofFlags}</TableCell>
                  <TableCell>{s.duplicateAccountSignals > 0 ? <span className="text-red-500 font-bold">{s.duplicateAccountSignals}</span> : s.duplicateAccountSignals}</TableCell>
                  <TableCell>{new Date(s.lastUpdated).toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                        Reclassify <ChevronDown className="ml-2 h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => reclassify({ userId: s.userId, level: 'LOW' })}>Set to LOW</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reclassify({ userId: s.userId, level: 'MEDIUM' })}>Set to MEDIUM</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reclassify({ userId: s.userId, level: 'HIGH' })}>Set to HIGH</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reclassify({ userId: s.userId, level: 'CRITICAL' })}>Set to CRITICAL</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

