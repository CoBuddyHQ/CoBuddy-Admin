'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEscrow } from '@/modules/financial/escrow/hooks/useEscrow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EscrowRecord } from '@/modules/financial/escrow/types';

export default function EscrowPage() {
  const { records, config, isLoading, releaseEscrow, updateStatus, updateConfig } = useEscrow();
  const [maxTx, setMaxTx] = useState(config?.maxPerTransaction?.toString() || '');
  const [maxDay, setMaxDay] = useState(config?.maxPerDay?.toString() || '');

  if (isLoading) return <div className="p-6">Loading...</div>;

  const handleSaveConfig = () => {
    updateConfig({
      maxPerTransaction: Number(maxTx) || config!.maxPerTransaction,
      maxPerDay: Number(maxDay) || config!.maxPerDay,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escrow & Wallet Monitoring"
        description="Monitor user wallets, manage escrow holds, and configure withdrawal limits."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Limits Configuration</CardTitle>
            <CardDescription>Set global limits for companion wallet withdrawals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Per Transaction (₹)</label>
              <Input 
                type="number" 
                value={maxTx} 
                onChange={(e) => setMaxTx(e.target.value)} 
                placeholder={config?.maxPerTransaction?.toString()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Per Day (₹)</label>
              <Input 
                type="number" 
                value={maxDay} 
                onChange={(e) => setMaxDay(e.target.value)}
                placeholder={config?.maxPerDay?.toString()}
              />
            </div>
            <Button onClick={handleSaveConfig}>Save Limits</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Directory</CardTitle>
          <CardDescription>View and manage individual user wallets and escrow funds.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>In Escrow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">{record.userName}</div>
                    <div className="text-xs text-muted-foreground">{record.userId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.userType === 'COMPANION' ? 'default' : 'secondary'}>
                      {record.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{record.walletBalance.toLocaleString()}</TableCell>
                  <TableCell>
                    {record.escrowHeldAmount > 0 ? (
                      <span className="text-destructive font-medium">₹{record.escrowHeldAmount.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">₹0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'ACTIVE' ? 'outline' : 'destructive'}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {record.escrowHeldAmount > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => releaseEscrow({ id: record.id, amount: record.escrowHeldAmount })}
                        >
                          Release
                        </Button>
                      )}
                      <Button 
                        variant={record.status === 'ACTIVE' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => updateStatus({ id: record.id, status: record.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE' })}
                      >
                        {record.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
