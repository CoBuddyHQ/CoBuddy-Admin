import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export function AddCityModal({ open, onOpenChange, onSubmit }: ModalProps) {
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && state && country) {
      onSubmit({ name, state, country, active: true });
      onOpenChange(false);
      setName(''); setState('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New City</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input placeholder="City Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input placeholder="State" value={state} onChange={e => setState(e.target.value)} required />
          <Input placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} required />
          <div className="flex justify-end"><Button type="submit">Add City</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddInterestModal({ open, onOpenChange, onSubmit }: ModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('ACTIVITY');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && type) {
      onSubmit({ name, type, active: true });
      onOpenChange(false);
      setName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Interest/Cuisine</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          <Select value={type} onValueChange={(val) => setType(val as string)}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVITY">Activity</SelectItem>
              <SelectItem value="CUISINE">Cuisine</SelectItem>
              <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end"><Button type="submit">Add Interest</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddLanguageModal({ open, onOpenChange, onSubmit }: ModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && code) {
      onSubmit({ name, code, active: true });
      onOpenChange(false);
      setName(''); setCode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add New Language</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input placeholder="Language Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input placeholder="Code (e.g. EN, HI)" value={code} onChange={e => setCode(e.target.value)} required />
          <div className="flex justify-end"><Button type="submit">Add Language</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
