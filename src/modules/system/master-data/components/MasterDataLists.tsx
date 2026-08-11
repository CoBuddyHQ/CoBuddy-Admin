import { useState, useEffect } from 'react';
import { searchAreaSuggestions } from '@/lib/mockPlacesAutocomplete';
import { City, Interest, Language, AppLanguage, Area } from '../types';
import { Switch } from '@/components/ui/switch';
import { getLocalizedText } from '@/lib/i18n/getLocalizedText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';

function getMissingLanguages(nameObj: Record<string, string>, appLanguages: AppLanguage[]) {
  const activeLangs = appLanguages.filter(l => l.active);
  return activeLangs.filter(l => !nameObj[l.code]).map(l => l.name);
}

interface CityListProps { 
  data: City[]; 
  appLanguages: AppLanguage[];
  onToggle: (id: string) => void; 
  onAddArea: (cityId: string, areaName: Record<string, string>, lat?: number, lng?: number) => void;
  onToggleArea: (cityId: string, areaId: string) => void;
  onEditTranslations: (city: City) => void;
}
export function CityList({ data, appLanguages, onToggle, onAddArea, onToggleArea, onEditTranslations }: CityListProps) {
  const [manageCity, setManageCity] = useState<City | null>(null);
  const [newAreaName, setNewAreaName] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat?: number; lng?: number }>({});

  useEffect(() => {
    if (!manageCity || !newAreaName['en']) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchAreaSuggestions(newAreaName['en'], manageCity.id);
      setSuggestions(results);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [newAreaName['en'], manageCity]);

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (manageCity && newAreaName['en']) {
      // Pass the lat/lng along with the name. We need to cast it or modify onAddArea to accept it.
      // The prompt says "optional to store returned lat/lng on the Area type" and "reasonable to add lat?: number; lng?: number to Area".
      // We'll pass it as part of a modified area object, but onAddArea signature takes Record<string, string>.
      // Wait, the signature is `onAddArea: (cityId: string, areaName: Record<string, string>) => void`.
      // Let's modify the props interface to allow passing lat/lng.
      onAddArea(manageCity.id, newAreaName, selectedLocation.lat, selectedLocation.lng);
      setNewAreaName({});
      setSelectedLocation({});
      setSuggestions([]);
    }
  };

  if (!data.length) return <EmptyState title="No cities configured" description="Add a new city to get started." />;

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>State</TableHeaderCell>
            <TableHeaderCell>Country</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(item => {
            const missing = getMissingLanguages(item.name, appLanguages);
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{getLocalizedText(item.name, 'en')}</span>
                    {missing.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px]">Missing: {missing.join(', ')}</Badge>
                        <Button variant="link" size="sm" className="h-4 p-0 text-[10px]" onClick={() => onEditTranslations(item)}>Edit Translations</Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.state}</TableCell>
                <TableCell>{item.country}</TableCell>
                <TableCell>
                  <Switch checked={item.active} onCheckedChange={() => onToggle(item.id)} />
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setManageCity(item)}>Manage Areas ({item.areas?.length || 0})</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!manageCity} onOpenChange={(open) => !open && setManageCity(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Areas for {manageCity ? getLocalizedText(manageCity.name, 'en') : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {(!manageCity?.areas || manageCity.areas.length === 0) ? (
              <EmptyState title="No areas yet" description="Add areas or localities to this city." icon={<></>} />
            ) : (
              <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                {manageCity.areas.map(area => (
                  <div key={area.id} className="flex items-center justify-between p-2 bg-background border rounded-md">
                    <span className="text-sm font-medium">{getLocalizedText(area.name, 'en')}</span>
                    <Switch checked={area.active} onCheckedChange={() => onToggleArea(manageCity.id, area.id)} />
                  </div>
                ))}
              </div>
            )}
            
            <form onSubmit={handleAddArea} className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold">Add New Area</h4>
              {appLanguages.filter(l => l.active).map(lang => (
                <div key={lang.code} className="space-y-2 relative">
                  <label className="text-sm font-medium">Name ({lang.name}){lang.code === 'en' ? ' *' : ''}</label>
                  <input 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={newAreaName[lang.code] || ''} 
                    onChange={e => {
                      setNewAreaName({ ...newAreaName, [lang.code]: e.target.value });
                      if (lang.code === 'en') setSelectedLocation({}); // Reset on manual edit
                    }} 
                    required={lang.code === 'en'}
                    autoComplete="off"
                  />
                  {lang.code === 'en' && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-48 overflow-auto">
                      {suggestions.map((s, idx) => (
                        <div 
                          key={idx} 
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                          onClick={() => {
                            setNewAreaName({ ...newAreaName, 'en': s.name });
                            setSelectedLocation({ lat: s.lat, lng: s.lng });
                            setSuggestions([]);
                          }}
                        >
                          {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={!newAreaName['en']}>
                <Plus className="h-4 w-4 mr-2" /> Add Area
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface InterestListProps { 
  data: Interest[]; 
  appLanguages: AppLanguage[];
  onToggle: (id: string) => void; 
  onEditTranslations: (interest: Interest) => void;
}
export function InterestList({ data, appLanguages, onToggle, onEditTranslations }: InterestListProps) {
  if (!data.length) return <EmptyState title="No interests configured" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => {
          const missing = getMissingLanguages(item.name, appLanguages);
          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span>{getLocalizedText(item.name, 'en')}</span>
                  {missing.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-[10px]">Missing: {missing.join(', ')}</Badge>
                      <Button variant="link" size="sm" className="h-4 p-0 text-[10px]" onClick={() => onEditTranslations(item)}>Edit Translations</Button>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>
                <Switch checked={item.active} onCheckedChange={() => onToggle(item.id)} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  );
}

interface LanguageListProps { data: Language[]; onToggle: (id: string) => void; }
export function LanguageList({ data, onToggle }: LanguageListProps) {
  if (!data.length) return <EmptyState title="No spoken languages configured" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.code}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Switch checked={item.active} onCheckedChange={() => onToggle(item.id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface AppLanguageListProps { data: AppLanguage[]; onToggle: (id: string) => void; }
export function AppLanguageList({ data, onToggle }: AppLanguageListProps) {
  if (!data.length) return <EmptyState title="No app languages configured" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.code}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Switch checked={item.active} onCheckedChange={() => onToggle(item.id)} disabled={item.code === 'en'} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface GenericCodeLabelListProps<T extends { id: string; code: string; label: Record<string, string>; active: boolean }> { 
  data: T[]; 
  appLanguages: AppLanguage[];
  onToggle: (id: string) => void; 
  onEditTranslations: (item: T) => void;
  codeLabel?: string;
}

export function GenericCodeLabelList<T extends { id: string; code: string; label: Record<string, string>; active: boolean }>({ data, appLanguages, onToggle, onEditTranslations, codeLabel = "Code" }: GenericCodeLabelListProps<T>) {
  if (!data.length) return <EmptyState title="No items configured" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{codeLabel}</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => {
          const missing = getMissingLanguages(item.label, appLanguages);
          return (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs">{item.code}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span>{getLocalizedText(item.label, 'en')}</span>
                  {missing.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-[10px]">Missing: {missing.join(', ')}</Badge>
                      <Button variant="link" size="sm" className="h-4 p-0 text-[10px]" onClick={() => onEditTranslations(item)}>Edit Translations</Button>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Switch checked={item.active} onCheckedChange={() => onToggle(item.id)} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  );
}

interface SessionDurationListProps { 
  data: any[]; 
  appLanguages: AppLanguage[];
  onToggle: (id: string) => void; 
  onEditTranslations: (item: any) => void;
}

export function SessionDurationList({ data, appLanguages, onToggle, onEditTranslations }: SessionDurationListProps) {
  if (!data.length) return <EmptyState title="No items configured" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Minutes</TableHeaderCell>
          <TableHeaderCell>Label</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => {
          const missing = getMissingLanguages(item.label, appLanguages);
          return (
            <TableRow key={item.id}>
              <TableCell>{item.minutes} mins</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span>{getLocalizedText(item.label, 'en')}</span>
                  {missing.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-[10px]">Missing: {missing.join(', ')}</Badge>
                      <Button variant="link" size="sm" className="h-4 p-0 text-[10px]" onClick={() => onEditTranslations(item)}>Edit Translations</Button>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Switch checked={item.active} onCheckedChange={() => onToggle(item.id)} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  );
}
