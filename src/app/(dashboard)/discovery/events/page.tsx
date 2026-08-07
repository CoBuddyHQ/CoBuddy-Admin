'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useEvents } from '@/modules/discovery/events/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, PauseCircle, PlayCircle } from 'lucide-react';

export default function EventsPage() {
  const { events, isLoading, createEvent, isCreating, toggleEvent } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', linkedCategory: '', startDate: '', endDate: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent(formData);
    setIsOpen(false);
    setFormData({ title: '', description: '', linkedCategory: '', startDate: '', endDate: '' });
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <PageHeader 
        title="Special Events & Category Highlights" 
        description="Manage promotional banners and featured categories on the customer app home screen."
        action={
          <Button onClick={() => setIsOpen(true)}>Create Event</Button>
        }
      />

      {isLoading ? (
        <div className="p-4">Loading Events...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-auto pb-6">
          {events.map(evt => (
            <Card key={evt.id} className={`flex flex-col ${evt.isActive ? 'border-primary' : 'opacity-70'}`}>
              <div className="h-32 bg-muted flex items-center justify-center rounded-t-md border-b relative">
                <span className="text-muted-foreground text-sm flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" /> Banner Image Placeholder
                </span>
                <Badge variant={evt.isActive ? 'default' : 'secondary'} className="absolute top-2 right-2">
                  {evt.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{evt.title}</CardTitle>
                <CardDescription>Category Link: <span className="font-medium text-foreground">{evt.linkedCategory || 'None'}</span></CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{evt.description}</p>
                <div className="mt-4 text-xs font-mono bg-muted p-2 rounded text-center">
                  {new Date(evt.startDate).toLocaleDateString()} - {new Date(evt.endDate).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-end">
                <Button variant={evt.isActive ? 'outline' : 'default'} onClick={() => toggleEvent(evt.id)} className="w-full">
                  {evt.isActive ? <PauseCircle className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                  {evt.isActive ? 'Deactivate Event' : 'Activate Event'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Special Event</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input placeholder="e.g. Valentine's Week" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Short description for the banner..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Linked Category (Optional)</Label>
              <Input placeholder="e.g. Dinner Dates" value={formData.linkedCategory} onChange={e => setFormData(p => ({ ...p, linkedCategory: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Clicking banner opens this category.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating}>Create Event</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
