'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCityLaunch } from '@/modules/operations/city-launch/hooks/useCityLaunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, CheckCircle, Rocket } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CityLaunchPage() {
  const { 
    launches, isLoadingLaunches, updateStatus, toggleTask, createLaunch,
    config, entries, isLoadingWaitlist, updateConfig, isUpdatingConfig, approveEntry
  } = useCityLaunch();

  const [formData, setFormData] = useState<any>(null);
  const [openLaunch, setOpenLaunch] = useState(false);
  const [launchData, setLaunchData] = useState({
    cityName: '',
    region: '',
    targetLaunchDate: '',
    managerName: ''
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmitConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) updateConfig(formData);
  };

  const handleCreateLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    createLaunch(launchData);
    setOpenLaunch(false);
    setLaunchData({ cityName: '', region: '', targetLaunchDate: '', managerName: '' });
  };

  if (isLoadingLaunches || isLoadingWaitlist || (config && !formData)) {
    return <div className="">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="City Launch & Waitlist Management"
        description="Track readiness checklists for new markets and manage user waitlists."
      />

      <Tabs defaultValue="launches" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="launches">City Launches</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist & Invites</TabsTrigger>
          </TabsList>
          
          <Dialog open={openLaunch} onOpenChange={setOpenLaunch}>
            <DialogTrigger render={<Button size="sm">New City Launch</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New City Launch</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLaunch} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City Name</Label>
                    <Input required value={launchData.cityName} onChange={e => setLaunchData({ ...launchData, cityName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Region/State</Label>
                    <Input required value={launchData.region} onChange={e => setLaunchData({ ...launchData, region: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Launch Date</Label>
                    <Input type="date" required value={launchData.targetLaunchDate} onChange={e => setLaunchData({ ...launchData, targetLaunchDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Manager Name</Label>
                    <Input required value={launchData.managerName} onChange={e => setLaunchData({ ...launchData, managerName: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit">Create Launch Plan</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="launches" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {launches.map(launch => {
              const allCompleted = launch.checklist.every(t => t.completed);
              
              return (
                <Card key={launch.id} className={launch.status === 'LIVE' ? 'border-primary/50 bg-primary/5' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          {launch.cityName}, {launch.region}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Manager: {launch.managerName} &bull; Target: {launch.targetLaunchDate}
                        </CardDescription>
                      </div>
                      <Badge variant={
                        launch.status === 'LIVE' ? 'default' : 
                        launch.status === 'READY' ? 'secondary' : 'outline'
                      }>
                        {launch.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Pre-launch Checklist</h4>
                        {launch.checklist.map(task => (
                          <div key={task.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={task.id} 
                              checked={task.completed}
                              onCheckedChange={() => toggleTask({ cityId: launch.id, taskId: task.id })}
                              disabled={launch.status === 'LIVE'}
                            />
                            <label 
                              htmlFor={task.id} 
                              className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {task.task}
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex gap-2 justify-end border-t">
                        {launch.status !== 'LIVE' && (
                          <>
                            <Button 
                              variant={allCompleted ? 'default' : 'secondary'}
                              disabled={!allCompleted || launch.status === 'READY'}
                              onClick={() => updateStatus({ id: launch.id, status: 'READY' })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Mark Ready
                            </Button>
                            <Button 
                              variant="default"
                              disabled={launch.status !== 'READY'}
                              onClick={() => updateStatus({ id: launch.id, status: 'LIVE' })}
                            >
                              <Rocket className="h-4 w-4 mr-1" /> Go Live
                            </Button>
                          </>
                        )}
                        {launch.status === 'LIVE' && (
                          <div className="text-sm text-primary font-medium flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> City is currently LIVE
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Access Configuration</CardTitle>
                <CardDescription>Toggle how new users sign up per city.</CardDescription>
              </CardHeader>
              <CardContent>
                {formData && (
                  <form onSubmit={handleSubmitConfig} className="space-y-6">
                    <div className="flex items-center justify-between border p-4 rounded-md">
                      <div className="space-y-0.5">
                        <Label className="text-base">Require Invite Code</Label>
                        <p className="text-sm text-muted-foreground">If disabled, anyone can sign up instantly.</p>
                      </div>
                      <Switch 
                        checked={formData.requireInviteCode} 
                        onCheckedChange={v => setFormData({ ...formData, requireInviteCode: v })} 
                      />
                    </div>

                    <div className="flex items-center justify-between border p-4 rounded-md">
                      <div className="space-y-0.5">
                        <Label className="text-base">Auto-approve Waitlist</Label>
                        <p className="text-sm text-muted-foreground">Bypasses manual review.</p>
                      </div>
                      <Switch 
                        checked={formData.autoApproveWaitlist} 
                        onCheckedChange={v => setFormData({ ...formData, autoApproveWaitlist: v })} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Daily Invites (Overall)</Label>
                      <Input type="number" min="0" value={formData.maxDailyInvites} onChange={e => setFormData({ ...formData, maxDailyInvites: Number(e.target.value) })} required />
                    </div>

                    <Button type="submit" disabled={isUpdatingConfig} className="w-full">
                      {isUpdatingConfig ? 'Saving...' : 'Update Settings'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 flex flex-col">
              <CardHeader>
                <CardTitle>Waitlisted Users</CardTitle>
                <CardDescription>Users pending approval to join the platform.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email / Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">{entry.email}</div>
                          <div className="text-xs text-muted-foreground">{entry.phone}</div>
                        </TableCell>
                        <TableCell>{entry.city}</TableCell>
                        <TableCell>{new Date(entry.signupDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={entry.status === 'APPROVED' ? 'default' : entry.status === 'PENDING' ? 'outline' : 'secondary'}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.status === 'PENDING' && (
                            <Button size="sm" onClick={() => approveEntry(entry.id)}>Approve</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

