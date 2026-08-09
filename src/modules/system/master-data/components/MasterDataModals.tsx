import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLanguage, City, Interest } from '../types';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  appLanguages?: AppLanguage[];
  initialData?: any;
}

export function AddCityModal({ open, onOpenChange, onSubmit, appLanguages = [], initialData }: ModalProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  useEffect(() => {
    if (open) {
      setNames(initialData?.name || {});
      setState(initialData?.state || '');
      setCountry(initialData?.country || 'India');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names['en'] && state && country) {
      if (initialData) {
        onSubmit({ ...initialData, name: names, state, country });
      } else {
        onSubmit({ name: names, state, country, active: true });
      }
      onOpenChange(false);
    }
  };

  const activeLangs = appLanguages.filter(l => l.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initialData ? 'Edit City' : 'Add New City'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Names</h4>
            {activeLangs.map(lang => (
              <Input 
                key={lang.code}
                placeholder={`Name (${lang.name})`} 
                value={names[lang.code] || ''} 
                onChange={e => setNames({ ...names, [lang.code]: e.target.value })} 
                required={lang.code === 'en'} 
              />
            ))}
          </div>
          <Input placeholder="State" value={state} onChange={e => setState(e.target.value)} required />
          <Input placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} required />
          <div className="flex justify-end"><Button type="submit">{initialData ? 'Save Changes' : 'Add City'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddInterestModal({ open, onOpenChange, onSubmit, appLanguages = [], initialData }: ModalProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [type, setType] = useState('ACTIVITY');

  useEffect(() => {
    if (open) {
      setNames(initialData?.name || {});
      setType(initialData?.type || 'ACTIVITY');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names['en'] && type) {
      if (initialData) {
        onSubmit({ ...initialData, name: names, type });
      } else {
        onSubmit({ 
          name: names, 
          type, 
          basePriceMultiplier: 1.0,
          active: true 
        });
      }
      onOpenChange(false);
    }
  };

  const activeLangs = appLanguages.filter(l => l.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initialData ? 'Edit Interest/Cuisine' : 'Add New Interest/Cuisine'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Names</h4>
            {activeLangs.map(lang => (
              <Input 
                key={lang.code}
                placeholder={`Name (${lang.name})`} 
                value={names[lang.code] || ''} 
                onChange={e => setNames({ ...names, [lang.code]: e.target.value })} 
                required={lang.code === 'en'} 
              />
            ))}
          </div>
          <Select value={type} onValueChange={(val) => setType(val as string)}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVITY">Activity</SelectItem>
              <SelectItem value="CUISINE">Cuisine</SelectItem>
              <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end"><Button type="submit">{initialData ? 'Save Changes' : 'Add Interest'}</Button></div>
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
        <DialogHeader><DialogTitle>Add New Spoken Language</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input placeholder="Language Name (e.g. Marathi)" value={name} onChange={e => setName(e.target.value)} required />
          <Input placeholder="Code (e.g. mr)" value={code} onChange={e => setCode(e.target.value)} required />
          <div className="flex justify-end"><Button type="submit">Add Language</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddAppLanguageModal({ open, onOpenChange, onSubmit }: ModalProps) {
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
        <DialogHeader><DialogTitle>Add New App Language</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input placeholder="Language Name (e.g. English)" value={name} onChange={e => setName(e.target.value)} required />
          <Input placeholder="Code (e.g. en)" value={code} onChange={e => setCode(e.target.value)} required />
          <div className="flex justify-end"><Button type="submit">Add Language</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
