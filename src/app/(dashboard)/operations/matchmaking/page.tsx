'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMatchmakingConfig } from '@/modules/operations/matchmaking/hooks/useMatchmakingConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function MatchmakingConfigPage() {
  const { config, isLoading, updateConfig, isUpdating } = useMatchmakingConfig();
  
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  if (isLoading || !formData) return <div className="">Loading configuration...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Search & Matchmaking Config" 
        description="Tune the algorithm governing how customers discover companions."
      />

      <div className="flex-1 overflow-auto">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Algorithm Parameters</CardTitle>
            <CardDescription>Changes apply globally to all new search requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="maxRadius">Maximum Search Radius (km)</Label>
                <Input 
                  id="maxRadius" 
                  type="number" 
                  min="5" 
                  max="100" 
                  value={formData.maxSearchRadiusKm} 
                  onChange={e => setFormData({ ...formData, maxSearchRadiusKm: Number(e.target.value) })} 
                />
                <p className="text-xs text-muted-foreground">Companions beyond this distance will not appear in customer searches.</p>
              </div>

              <div className="space-y-2">
                <Label>Priority Algorithm</Label>
                <Select 
                  value={formData.priorityAlgorithm} 
                  onValueChange={v => setFormData({ ...formData, priorityAlgorithm: v as string })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RATING_BASED">Rating Based (Highest Rated First)</SelectItem>
                    <SelectItem value="DISTANCE_BASED">Distance Based (Closest First)</SelectItem>
                    <SelectItem value="NEW_COMPANION_BOOST">New Companion Boost (Balanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRating">Minimum Rating Threshold</Label>
                <Input 
                  id="minRating" 
                  type="number" 
                  min="1" 
                  max="5" 
                  step="0.1"
                  value={formData.minRatingThreshold} 
                  onChange={e => setFormData({ ...formData, minRatingThreshold: Number(e.target.value) })} 
                />
                <p className="text-xs text-muted-foreground">Companions below this rating are hidden from general search.</p>
              </div>

              <div className="flex items-center justify-between border p-4 rounded-md">
                <div className="space-y-0.5">
                  <Label className="text-base">Allow Cross-City Booking</Label>
                  <p className="text-sm text-muted-foreground">Allows customers to book companions in a different city (for travel).</p>
                </div>
                <Switch 
                  checked={formData.allowCrossCityBooking} 
                  onCheckedChange={v => setFormData({ ...formData, allowCrossCityBooking: v })} 
                />
              </div>

              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Configuration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

