'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useVenues } from '@/modules/operations/venues/hooks/useVenues';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Building2 } from 'lucide-react';

export default function VenuesPage() {
  const { venues, placeTypes, isLoading, toggleVenue, deleteVenue, togglePlaceType } = useVenues();

  if (isLoading) return <div className="p-6">Loading...</div>;

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
              <Button size="sm">Add Featured Venue</Button>
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
                        <div className="font-medium">{venue.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{venue.address}</div>
                      <div className="text-xs text-muted-foreground">{venue.city}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{venue.category}</Badge></TableCell>
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
                    <div className="font-medium text-sm">{pt.displayName}</div>
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
