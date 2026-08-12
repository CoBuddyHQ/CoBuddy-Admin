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

interface GenericCodeLabelModalProps extends ModalProps {
  title: string;
  codePlaceholder?: string;
}

export function GenericCodeLabelModal({ open, onOpenChange, onSubmit, appLanguages = [], initialData, title, codePlaceholder = "Code" }: GenericCodeLabelModalProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [code, setCode] = useState('');

  useEffect(() => {
    if (open) {
      setNames(initialData?.label || {});
      setCode(initialData?.code || '');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names['en'] && code) {
      if (initialData) {
        onSubmit({ ...initialData, label: names, code });
      } else {
        onSubmit({ label: names, code, active: true });
      }
      onOpenChange(false);
    }
  };

  const activeLangs = appLanguages.filter(l => l.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initialData ? `Edit ${title}` : `Add New ${title}`}</DialogTitle></DialogHeader>
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
          <Input placeholder={codePlaceholder} value={code} onChange={e => setCode(e.target.value)} required />
          <div className="flex justify-end"><Button type="submit">{initialData ? 'Save Changes' : `Add ${title}`}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddSessionDurationModal({ open, onOpenChange, onSubmit, appLanguages = [], initialData }: ModalProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [minutes, setMinutes] = useState<string>('');

  useEffect(() => {
    if (open) {
      setNames(initialData?.label || {});
      setMinutes(initialData?.minutes ? initialData.minutes.toString() : '');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names['en'] && minutes && !isNaN(Number(minutes))) {
      if (initialData) {
        onSubmit({ ...initialData, label: names, minutes: Number(minutes) });
      } else {
        onSubmit({ label: names, minutes: Number(minutes), active: true });
      }
      onOpenChange(false);
    }
  };

  const activeLangs = appLanguages.filter(l => l.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initialData ? 'Edit Session Duration' : 'Add New Session Duration'}</DialogTitle></DialogHeader>
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
          <Input placeholder="Duration in minutes (e.g. 60)" type="number" value={minutes} onChange={e => setMinutes(e.target.value)} required />
          <div className="flex justify-end"><Button type="submit">{initialData ? 'Save Changes' : 'Add Session Duration'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddReviewTagModal({ open, onOpenChange, onSubmit, appLanguages = [], initialData }: ModalProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [code, setCode] = useState('');
  const [polarity, setPolarity] = useState('PRAISE');
  const [appliesTo, setAppliesTo] = useState('BOTH');

  useEffect(() => {
    if (open) {
      setNames(initialData?.label || {});
      setCode(initialData?.code || '');
      setPolarity(initialData?.polarity || 'PRAISE');
      setAppliesTo(initialData?.appliesTo || 'BOTH');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names['en'] && code) {
      if (initialData) {
        onSubmit({ ...initialData, label: names, code, polarity, appliesTo });
      } else {
        onSubmit({ label: names, code, polarity, appliesTo, active: true });
      }
      onOpenChange(false);
    }
  };

  const activeLangs = appLanguages.filter(l => l.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initialData ? 'Edit Review Tag' : 'Add New Review Tag'}</DialogTitle></DialogHeader>
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
          <Input placeholder="Code (e.g. friendly)" value={code} onChange={e => setCode(e.target.value)} required />
          <Select value={polarity} onValueChange={(val) => setPolarity(val as string)}>
            <SelectTrigger><SelectValue placeholder="Polarity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRAISE">Praise</SelectItem>
              <SelectItem value="CONCERN">Concern</SelectItem>
            </SelectContent>
          </Select>
          <Select value={appliesTo} onValueChange={(val) => setAppliesTo(val as string)}>
            <SelectTrigger><SelectValue placeholder="Applies To" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER_RATING_COMPANION">Customer Rating Companion</SelectItem>
              <SelectItem value="COMPANION_RATING_CUSTOMER">Companion Rating Customer</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end"><Button type="submit">{initialData ? 'Save Changes' : 'Add Review Tag'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddCancellationReasonModal({ open, onOpenChange, onSubmit, appLanguages = [], initialData }: ModalProps) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [code, setCode] = useState('');
  const [appliesTo, setAppliesTo] = useState('ANY');

  useEffect(() => {
    if (open) {
      setNames(initialData?.label || {});
      setCode(initialData?.code || '');
      setAppliesTo(initialData?.appliesTo || 'ANY');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (names['en'] && code) {
      if (initialData) {
        onSubmit({ ...initialData, label: names, code, appliesTo });
      } else {
        onSubmit({ label: names, code, appliesTo, active: true });
      }
      onOpenChange(false);
    }
  };

  const activeLangs = appLanguages.filter(l => l.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initialData ? 'Edit Cancellation Reason' : 'Add New Cancellation Reason'}</DialogTitle></DialogHeader>
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
          <Input placeholder="Code (e.g. emergency)" value={code} onChange={e => setCode(e.target.value)} required />
          <Select value={appliesTo} onValueChange={(val) => setAppliesTo(val as string)}>
            <SelectTrigger><SelectValue placeholder="Applies To" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER_CANCEL">Customer Cancel</SelectItem>
              <SelectItem value="COMPANION_REJECT">Companion Reject</SelectItem>
              <SelectItem value="COMPANION_CANCEL">Companion Cancel</SelectItem>
              <SelectItem value="COMPANION_EARLY_END">Companion Early End</SelectItem>
              <SelectItem value="ANY">Any</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end"><Button type="submit">{initialData ? 'Save Changes' : 'Add Cancellation Reason'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
