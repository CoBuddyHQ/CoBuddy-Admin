'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useVenues } from '@/modules/operations/venues/hooks/useVenues';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Building2, Edit } from 'lucide-react';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { AppLanguage } from '@/modules/system/master-data/types';

function getMissingLanguages(nameObj: Record<string, string>, appLanguages: AppLanguage[]) {
  const activeLangs = appLanguages.filter(l => l.active);
  return activeLangs.filter(l => !nameObj[l.code]).map(l => l.name);
}

export default function VenuesPage() {
  const { venues, isLoading: venuesLoading, toggleVenue, deleteVenue, createVenue } = useVenues();
  const { appLanguages, placeTypes = [], togglePlaceTypeAllowed, isLoading: mdLoading } = useMasterData();
  const activeLangs = appLanguages?.filter(l => l.active) || [];

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    names: {} as Record<string, string>,
    address: '',
    categoryId: '',
    city: '',
    photoUrl: ''
  });
  const [editVenue, setEditVenue] = useState<any>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.names['en']) {
      const selectedPt = placeTypes.find(pt => pt.id === formData.categoryId);
      createVenue({
        name: formData.names,
        address: formData.address,
        category: selectedPt ? selectedPt.displayName : { en: formData.categoryId },
        city: formData.city,
        photoUrl: formData.photoUrl
      });
      setOpen(false);
      setFormData({ names: {}, address: '', categoryId: '', city: '', photoUrl: '' });
    }
  };

  const handleEditTranslations = (venue: any) => {
    setFormData({
      names: { ...venue.name },
      address: venue.address,
      categoryId: venue.category.en,
      city: venue.city,
      photoUrl: venue.photoUrl
    });
    setEditVenue(venue);
    setOpen(true);
  };

  if (venuesLoading || mdLoading) return <div className="p-6">Loading...</div>;

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
              <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setEditVenue(null); setFormData({ names: {}, address: '', categoryId: '', city: '', photoUrl: '' }); } }}>
                <Button size="sm" onClick={() => setOpen(true)}>Add Featured Venue</Button>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editVenue ? 'Edit Venue' : 'Add Featured Venue'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 pt-4">
                    <div className="space-y-4 border p-4 rounded-md">
                      <h4 className="text-sm font-medium">Names</h4>
                      {activeLangs.map(lang => (
                        <div key={lang.code} className="space-y-2">
                          <Label>Venue Name ({lang.name}){lang.code === 'en' ? ' *' : ''}</Label>
                          <Input required={lang.code === 'en'} value={formData.names[lang.code] || ''} onChange={e => setFormData({ ...formData, names: { ...formData.names, [lang.code]: e.target.value } })} />
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.categoryId} onValueChange={(v: any) => setFormData({ ...formData, categoryId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select a Category" /></SelectTrigger>
                        <SelectContent>
                          {allowedCategories.map(pt => (
                            <SelectItem key={pt.id} value={pt.id}>
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
                      <Button type="submit">{editVenue ? 'Save Changes' : 'Add Venue'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {venues.length === 0 ? (
              <EmptyState title="No venues found" description="Add a featured venue to get started." />
            ) : (
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
                  {venues.map((venue) => {
                    const missing = getMissingLanguages(venue.name, appLanguages || []);
                    return (
                      <TableRow key={venue.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="font-medium">{getLocalizedText(venue.name, 'en')}</div>
                            </div>
                            {missing.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-[10px]">Missing: {missing.join(', ')}</Badge>
                                <Button variant="link" size="sm" className="h-4 p-0 text-[10px]" onClick={() => handleEditTranslations(venue)}>Edit Translations</Button>
                              </div>
                            )}
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
                            <Button variant="outline" size="sm" title="Edit Content" onClick={() => handleEditTranslations(venue)}>
                              <Edit className="h-4 w-4" />
                            </Button>
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
                    );
                  })}
                </TableBody>
              </Table>
            )}
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
                      onCheckedChange={() => togglePlaceTypeAllowed(pt.id)}
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
