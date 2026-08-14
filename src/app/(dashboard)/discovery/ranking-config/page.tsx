'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useUIDiscovery } from '@/modules/discovery/ranking-config/hooks/useUIDiscovery';
import { useRankingConfig } from '@/modules/discovery/ranking-config/hooks/useRankingConfig';
import { useMatchmakingConfig } from '@/modules/operations/matchmaking/hooks/useMatchmakingConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

export default function DiscoveryRankingPage() {
  const { settings, isLoading: isUISettingsLoading, updateSettings, isUpdating } = useUIDiscovery();
  const { weights, promoted, isLoadingWeights, isLoadingPromoted, updateWeights, isUpdatingWeights, addPromoted, removePromoted } = useRankingConfig();
  const { config: matchConfig, isLoading: isLoadingMatch } = useMatchmakingConfig();
  
  const [uiFormData, setUiFormData] = useState<any>(null);
  const [weightsFormData, setWeightsFormData] = useState<any>(null);
  
  const [newPromotedName, setNewPromotedName] = useState('');
  const [newPromotedDate, setNewPromotedDate] = useState('');

  useEffect(() => {
    if (settings) setUiFormData(settings);
  }, [settings]);

  useEffect(() => {
    if (weights) setWeightsFormData(weights);
  }, [weights]);

  if (isUISettingsLoading || isLoadingWeights || isLoadingPromoted || isLoadingMatch || !uiFormData || !weightsFormData || !matchConfig) {
    return <div className="">Loading settings...</div>;
  }

  const handleUISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(uiFormData);
  };

  const handleWeightsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = Number(weightsFormData.trustScoreWeight) + Number(weightsFormData.distanceWeight) + Number(weightsFormData.availabilityWeight);
    if (sum !== 100) {
      alert(`Weights must sum to 100%. Current sum: ${sum}%`);
      return;
    }
    updateWeights({
      trustScoreWeight: Number(weightsFormData.trustScoreWeight),
      distanceWeight: Number(weightsFormData.distanceWeight),
      availabilityWeight: Number(weightsFormData.availabilityWeight),
      newCompanionBoostPercent: Number(weightsFormData.newCompanionBoostPercent),
    });
  };

  const handleAddPromoted = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPromotedName && newPromotedDate) {
      addPromoted({ name: newPromotedName, promotedUntil: newPromotedDate });
      setNewPromotedName('');
      setNewPromotedDate('');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Discovery & Ranking Config" 
        description="Configure how the app ranks companions and behaves for end users."
      />

      <Tabs defaultValue="ranking" className="flex-1 overflow-auto flex flex-col">
        <TabsList>
          <TabsTrigger value="ranking">Ranking Weights</TabsTrigger>
          <TabsTrigger value="app">App Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="flex-1 space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleWeightsSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Weights</CardTitle>
                  <CardDescription>Adjust the core factors used to rank companions in the Explore feed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Trust Score Weight (%)</Label>
                    <Input type="number" min="0" max="100" value={weightsFormData.trustScoreWeight} onChange={e => setWeightsFormData({...weightsFormData, trustScoreWeight: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Distance Weight (%)</Label>
                    <Input type="number" min="0" max="100" value={weightsFormData.distanceWeight} onChange={e => setWeightsFormData({...weightsFormData, distanceWeight: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Availability Weight (%)</Label>
                    <Input type="number" min="0" max="100" value={weightsFormData.availabilityWeight} onChange={e => setWeightsFormData({...weightsFormData, availabilityWeight: e.target.value})} />
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <Label>New Companion Boost (%)</Label>
                    <p className="text-xs text-muted-foreground">Artificial ranking boost given to new signups for their first 7 days.</p>
                    <Input type="number" min="0" max="100" value={weightsFormData.newCompanionBoostPercent} onChange={e => setWeightsFormData({...weightsFormData, newCompanionBoostPercent: e.target.value})} />
                  </div>
                </CardContent>
              </Card>
              <Button type="submit" disabled={isUpdatingWeights}>
                {isUpdatingWeights ? 'Saving...' : 'Save Algorithm Weights'}
              </Button>
            </form>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Algorithm Preview</CardTitle>
                  <CardDescription>Estimated top results based on current weights.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const mockCandidates = [
                        { id: '1', name: 'Sarah M.', trustScore: 98, distanceKm: 2, availability: 90, isNew: false },
                        { id: '2', name: 'Rahul K.', trustScore: 95, distanceKm: 1, availability: 80, isNew: false },
                        { id: '3', name: 'Anjali T.', trustScore: 85, distanceKm: 3, availability: 95, isNew: true },
                        { id: '4', name: 'Vikram P.', trustScore: 90, distanceKm: 5, availability: 70, isNew: false },
                        { id: '5', name: 'Pooja R.', trustScore: 70, distanceKm: 0.5, availability: 100, isNew: false },
                      ];

                      const tWeight = matchConfig.priorityAlgorithm === 'RATING_BASED' ? 100 : Number(weightsFormData.trustScoreWeight) || 0;
                      const dWeight = matchConfig.priorityAlgorithm === 'DISTANCE_BASED' ? 100 : Number(weightsFormData.distanceWeight) || 0;
                      const aWeight = Number(weightsFormData.availabilityWeight) || 0;
                      const boostPct = matchConfig.priorityAlgorithm === 'NEW_COMPANION_BOOST' ? 50 : Number(weightsFormData.newCompanionBoostPercent) || 0;

                      const scored = mockCandidates
                        .filter(c => c.distanceKm <= matchConfig.maxSearchRadiusKm)
                        .filter(c => (c.trustScore / 20) >= matchConfig.minRatingThreshold)
                        .map(c => {
                          const distScore = Math.max(0, 100 - c.distanceKm * 10);
                          const baseScore = (c.trustScore * tWeight + distScore * dWeight + c.availability * aWeight) / 100;
                          const finalScore = c.isNew ? baseScore * (1 + boostPct / 100) : baseScore;
                          return { ...c, score: finalScore };
                        });

                      scored.sort((a, b) => b.score - a.score);

                      return scored.map((c, idx) => (
                        <div key={c.id} className={`p-3 rounded flex justify-between ${c.isNew ? 'bg-muted/50 border-l-2 border-primary' : 'bg-muted/50'}`}>
                          <span>
                            {idx + 1}. {c.name} ({c.isNew ? 'New Boost' : `${c.trustScore} Trust, ${c.distanceKm}km`})
                          </span>
                          <span className="font-medium text-green-600">{c.score.toFixed(1)} pts</span>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Promotions</CardTitle>
                  <CardDescription>Force-pin specific companions to the top of results.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddPromoted} className="flex gap-2">
                    <Input placeholder="Companion Name" value={newPromotedName} onChange={e => setNewPromotedName(e.target.value)} required />
                    <Input type="date" value={newPromotedDate} onChange={e => setNewPromotedDate(e.target.value)} required />
                    <Button type="submit">Add</Button>
                  </form>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Companion</TableHead>
                        <TableHead>Promoted Until</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoted?.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.promotedUntil}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removePromoted(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="app" className="flex-1 pt-4">
          <form onSubmit={handleUISubmit} className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Theme & Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-md">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Theme Default</Label>
                    <p className="text-sm text-muted-foreground">Force dark mode for new users.</p>
                  </div>
                  <Switch 
                    checked={uiFormData.enableDarkThemeDefault} 
                    onCheckedChange={v => setUiFormData({ ...uiFormData, enableDarkThemeDefault: v })} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Home Screen Layout</Label>
                  <Select value={uiFormData.homeScreenLayout} onValueChange={v => setUiFormData({ ...uiFormData, homeScreenLayout: v as string })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRID">Grid View (Photos first)</SelectItem>
                      <SelectItem value="LIST">List View (Details first)</SelectItem>
                      <SelectItem value="MAP_FIRST">Map View (Location first)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Featured Section</CardTitle>
                <CardDescription>Controls for the top carousel on the home screen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Featured Section Title</Label>
                  <Input value={uiFormData.featuredSectionTitle} onChange={e => setUiFormData({ ...uiFormData, featuredSectionTitle: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Max Featured Companions</Label>
                  <Input type="number" min="1" max="20" value={uiFormData.maxFeaturedCompanions} onChange={e => setUiFormData({ ...uiFormData, maxFeaturedCompanions: Number(e.target.value) })} required />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Configuration'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

