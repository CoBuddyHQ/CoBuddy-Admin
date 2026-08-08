'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useVenues } from '@/modules/operations/venues/hooks/useVenues';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Building2 } from 'lucide-react';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VenuesPage() {
  const { venues, placeTypes, isLoading, toggleVenue, deleteVenue, togglePlaceType, createVenue } = useVenues();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nameEn: '',
    address: '',
    categoryEn: '',
    city: '',
    photoUrl: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createVenue({
      name: { en: formData.nameEn },
      address: formData.address,
      category: { en: formData.categoryEn },
      city: formData.city,
      photoUrl: formData.photoUrl
    });
    setOpen(false);
    setFormData({ nameEn: '', address: '', categoryEn: '', city: '', photoUrl: '' });
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  const allowedCategories = placeTypes.filter(pt => pt.isAllowed);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Venue Management"
        description="Manage featured venues and configure global Google Places category rules."
      />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Featured Venues (Layer 1)</CardTitle>
                <CardDescription>Hand-picked venues shown as highlights to customers.</CardDescription>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={<Button size="sm">Add Featured Venue</Button>} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Featured Venue</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Venue Name</Label>
                      <Input required value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.categoryEn} onValueChange={(v: any) => setFormData({ ...formData, categoryEn: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {allowedCategories.map(pt => (
                            <SelectItem key={pt.id} value={pt.displayName.en || pt.typeName}>
                              {getLocalizedText(pt.displayName)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Photo URL</Label>
                        <Input type="url" value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit">Add Venue</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="font-medium">{getLocalizedText(venue.name)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{venue.address}</div>
                      <div className="text-xs text-muted-foreground">{venue.city}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{getLocalizedText(venue.category)}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={venue.isActive ? 'default' : 'secondary'}>
                        {venue.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant={venue.isActive ? "secondary" : "default"}
                          size="sm"
                          onClick={() => toggleVenue(venue.id)}
                        >
                          {venue.isActive ? 'Hide' : 'Show'}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteVenue(venue.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Place Types (Layer 2)</CardTitle>
            <CardDescription>Global Google Places API filter rules.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {placeTypes.map((pt) => (
                <div key={pt.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{getLocalizedText(pt.displayName)}</div>
                    <div className="text-xs text-muted-foreground font-mono">{pt.typeName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {pt.isAllowed ? 'Allowed' : 'Blocked'}
                    </span>
                    <Switch 
                      checked={pt.isAllowed}
                      onCheckedChange={() => togglePlaceType(pt.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
