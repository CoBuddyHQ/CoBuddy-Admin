'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useRefunds } from '@/modules/financial/refunds/hooks/useRefunds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RefundsPage() {
  const { refunds, settings, isLoading, processRefund, updateSettings, isUpdatingSettings } = useRefunds();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const handleSubmitSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) updateSettings(formData);
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Refunds & Booking Settings" 
        description="Process refunds and configure global booking duration/cancellation policies."
      />

      {isLoading || (settings && !formData) ? (
        <div>Loading...</div>
      ) : (
        <Tabs defaultValue="refunds" className="space-y-6 flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="refunds">Refund Requests</TabsTrigger>
            <TabsTrigger value="settings">Booking Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="refunds" className="flex-1 overflow-auto min-h-0">
            <div className="bg-background rounded-md border h-full overflow-auto p-4">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Refund ID</TableHeaderCell>
                    <TableHeaderCell>Booking ID</TableHeaderCell>
                    <TableHeaderCell>User</TableHeaderCell>
                    <TableHeaderCell>Amount</TableHeaderCell>
                    <TableHeaderCell>Reason</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Action</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {refunds.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.bookingId}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.userName}</div>
                        <div className="text-xs text-muted-foreground">{r.userId}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{formatCurrency(r.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs whitespace-normal text-sm">{r.reason}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'PENDING' ? 'outline' : r.status === 'PROCESSED' ? 'default' : 'secondary'}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === 'PENDING' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                              Process <ChevronDown className="ml-2 h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => processRefund({ id: r.id, action: 'APPROVE' })} className="text-green-600 font-medium">Approve Refund</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => processRefund({ id: r.id, action: 'REJECT' })} className="text-destructive font-medium">Reject Request</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Booking Policy Configurations</CardTitle>
                <CardDescription>Global limits on duration and cancellations.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitSettings} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Booking Duration (Mins)</Label>
                      <Input type="number" min="0" value={formData?.minBookingDurationMins || ''} onChange={e => setFormData({ ...formData, minBookingDurationMins: Number(e.target.value) })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Booking Duration (Mins)</Label>
                      <Input type="number" min="0" value={formData?.maxBookingDurationMins || ''} onChange={e => setFormData({ ...formData, maxBookingDurationMins: Number(e.target.value) })} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cancellation Grace Period (Mins)</Label>
                    <p className="text-xs text-muted-foreground">Free cancellation window after booking confirmation.</p>
                    <Input type="number" min="0" value={formData?.cancellationGracePeriodMins || ''} onChange={e => setFormData({ ...formData, cancellationGracePeriodMins: Number(e.target.value) })} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Auto-Cancel Unaccepted Booking (Mins)</Label>
                    <p className="text-xs text-muted-foreground">Time before unresponded request expires.</p>
                    <Input type="number" min="0" value={formData?.autoCancelUnacceptedMins || ''} onChange={e => setFormData({ ...formData, autoCancelUnacceptedMins: Number(e.target.value) })} required />
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label>Cancellation Refund Tiers</Label>
                        <p className="text-xs text-muted-foreground">Percentage of refund based on notice time before booking.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        const newTier = { id: `t${Date.now()}`, noticeHoursMin: 0, noticeHoursMax: 24, refundPercent: 0 };
                        setFormData({ ...formData, cancellationRefundTiers: [...(formData.cancellationRefundTiers || []), newTier] });
                      }}>
                        <Plus className="w-4 h-4 mr-1" /> Add Tier
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(formData?.cancellationRefundTiers || []).map((tier: any, index: number) => (
                        <div key={tier.id} className="flex gap-2 items-center bg-muted/50 p-2 rounded-md">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Min Hours Notice</Label>
                            <Input 
                              type="number" min="0" value={tier.noticeHoursMin}
                              onChange={(e) => {
                                const newTiers = [...formData.cancellationRefundTiers];
                                newTiers[index].noticeHoursMin = Number(e.target.value);
                                setFormData({ ...formData, cancellationRefundTiers: newTiers });
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Max Hours (Empty = ∞)</Label>
                            <Input 
                              type="number" min="0" placeholder="∞" value={tier.noticeHoursMax === null ? '' : tier.noticeHoursMax}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newTiers = [...formData.cancellationRefundTiers];
                                newTiers[index].noticeHoursMax = val === '' ? null : Number(val);
                                setFormData({ ...formData, cancellationRefundTiers: newTiers });
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Refund %</Label>
                            <Input 
                              type="number" min="0" max="100" value={tier.refundPercent}
                              onChange={(e) => {
                                const newTiers = [...formData.cancellationRefundTiers];
                                newTiers[index].refundPercent = Number(e.target.value);
                                setFormData({ ...formData, cancellationRefundTiers: newTiers });
                              }}
                            />
                          </div>
                          <Button 
                            type="button" variant="ghost" size="icon" className="mt-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const newTiers = [...formData.cancellationRefundTiers];
                              newTiers.splice(index, 1);
                              setFormData({ ...formData, cancellationRefundTiers: newTiers });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {(!formData?.cancellationRefundTiers || formData.cancellationRefundTiers.length === 0) && (
                        <div className="text-sm text-muted-foreground text-center p-4 border rounded-md">No tiers configured. (100% refund default)</div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={isUpdatingSettings} className="w-full mt-4">
                    {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
