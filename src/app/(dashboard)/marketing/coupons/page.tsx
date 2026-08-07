'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCoupons } from '@/modules/marketing/coupons/hooks/useCoupons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import { PauseCircle, PlayCircle } from 'lucide-react';

export default function CouponsPage() {
  const { coupons, isLoading, createCoupon, isCreating, toggleStatus } = useCoupons();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', validFrom: '', validTo: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCoupon({
      code: formData.code.toUpperCase(),
      discountType: formData.discountType as 'PERCENTAGE' | 'FLAT',
      discountValue: Number(formData.discountValue),
      maxUses: Number(formData.maxUses),
      validFrom: formData.validFrom,
      validTo: formData.validTo
    });
    setIsOpen(false);
    setFormData({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', validFrom: '', validTo: '' });
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Discount Codes & Coupons" 
        description="Create and manage promotional campaigns to boost bookings."
        action={
          <Button onClick={() => setIsOpen(true)}>Create Coupon</Button>
        }
      />

      <div className="bg-background rounded-md border flex-1 overflow-auto p-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Code</TableHeaderCell>
                <TableHeaderCell>Discount</TableHeaderCell>
                <TableHeaderCell>Uses</TableHeaderCell>
                <TableHeaderCell>Valid From</TableHeaderCell>
                <TableHeaderCell>Valid To</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold font-mono">{c.code}</TableCell>
                  <TableCell>{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}</TableCell>
                  <TableCell>{c.currentUses} / {c.maxUses}</TableCell>
                  <TableCell>{new Date(c.validFrom).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(c.validTo).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'EXPIRED' ? 'secondary' : c.status === 'PAUSED' ? 'outline' : 'default'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.status !== 'EXPIRED' && (
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(c.id)}>
                        {c.status === 'ACTIVE' ? <PauseCircle className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                        {c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Coupon Code</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input placeholder="e.g. SUMMER20" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.discountType} onValueChange={v => setFormData(p => ({ ...p, discountType: v as string }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" min="1" placeholder="20" value={formData.discountValue} onChange={e => setFormData(p => ({ ...p, discountValue: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input type="number" min="1" placeholder="1000" value={formData.maxUses} onChange={e => setFormData(p => ({ ...p, maxUses: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input type="datetime-local" value={formData.validFrom} onChange={e => setFormData(p => ({ ...p, validFrom: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Valid To</Label>
                <Input type="datetime-local" value={formData.validTo} onChange={e => setFormData(p => ({ ...p, validTo: e.target.value }))} required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating}>Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
