'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useCityLaunch } from '@/modules/operations/city-launch/hooks/useCityLaunch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, CheckCircle, Rocket } from 'lucide-react';

export default function CityLaunchPage() {
  const { launches, isLoading, updateStatus, toggleTask } = useCityLaunch();

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="City Launch Management"
        description="Track readiness checklists and approve go-live for new markets."
      />

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
    </div>
  );
}
