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

import { useSystemConfig } from '@/modules/system/config/hooks/useSystemConfig';
import { Input } from '@/components/ui/input';

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
  onUpdateServiceHours: (cityId: string, hours: { openTime: string; closeTime: string } | null) => void;
}
export function CityList({ data, appLanguages, onToggle, onAddArea, onToggleArea, onEditTranslations, onUpdateServiceHours }: CityListProps) {
  const [manageCity, setManageCity] = useState<City | null>(null);
  const [newAreaName, setNewAreaName] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat?: number; lng?: number }>({});

  const { config } = useSystemConfig();
  const defaultHours = config?.serviceHours || { openTime: '06:00', closeTime: '23:00' };

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
            <TableHeaderCell>Service Hours</TableHeaderCell>
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
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">
                      {item.serviceHoursOverride ? `${item.serviceHoursOverride.openTime} - ${item.serviceHoursOverride.closeTime}` : `${defaultHours.openTime} - ${defaultHours.closeTime}`}
                    </span>
                    {item.serviceHoursOverride ? (
                      <Badge variant="outline" className="w-fit text-[10px]">Custom</Badge>
                    ) : (
                      <Badge variant="secondary" className="w-fit text-[10px]">Default</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch checked={item.active} onCheckedChange={() => onToggle(item.id)} />
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setManageCity(item)}>Manage City</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!manageCity} onOpenChange={(open) => !open && setManageCity(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Settings for {manageCity ? getLocalizedText(manageCity.name, 'en') : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Service Hours</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Custom hours for this city</span>
                <Switch 
                  checked={!!manageCity?.serviceHoursOverride} 
                  onCheckedChange={(checked) => {
                    if (manageCity) {
                      if (checked) {
                        onUpdateServiceHours(manageCity.id, { ...defaultHours });
                        setManageCity({ ...manageCity, serviceHoursOverride: { ...defaultHours } });
                      } else {
                        onUpdateServiceHours(manageCity.id, null);
                        setManageCity({ ...manageCity, serviceHoursOverride: null });
                      }
                    }
                  }} 
                />
              </div>
              {manageCity?.serviceHoursOverride && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Opening Time</label>
                    <Input 
                      type="time" 
                      value={manageCity.serviceHoursOverride.openTime}
                      onChange={(e) => {
                        const newOpen = e.target.value;
                        const close = manageCity.serviceHoursOverride!.closeTime;
                        if (newOpen && newOpen < close) {
                          const newHours = { ...manageCity.serviceHoursOverride!, openTime: newOpen };
                          onUpdateServiceHours(manageCity.id, newHours);
                          setManageCity({ ...manageCity, serviceHoursOverride: newHours });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Closing Time</label>
                    <Input 
                      type="time" 
                      value={manageCity.serviceHoursOverride.closeTime}
                      onChange={(e) => {
                        const newClose = e.target.value;
                        const open = manageCity.serviceHoursOverride!.openTime;
                        if (newClose && newClose > open) {
                          const newHours = { ...manageCity.serviceHoursOverride!, closeTime: newClose };
                          onUpdateServiceHours(manageCity.id, newHours);
                          setManageCity({ ...manageCity, serviceHoursOverride: newHours });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-4">Areas ({manageCity?.areas?.length || 0})</h4>
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

interface ReviewTagListProps { 
  data: any[]; 
  appLanguages: AppLanguage[];
  onToggle: (id: string) => void; 
  onEditTranslations: (item: any) => void;
}

export function ReviewTagList({ data, appLanguages, onToggle, onEditTranslations }: ReviewTagListProps) {
  if (!data.length) return <EmptyState title="No items configured" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Polarity</TableHeaderCell>
          <TableHeaderCell>Applies To</TableHeaderCell>
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
                <Badge variant={item.polarity === 'PRAISE' ? 'default' : 'destructive'}>{item.polarity}</Badge>
              </TableCell>
              <TableCell>{item.appliesTo.replace(/_/g, ' ')}</TableCell>
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

interface CancellationReasonListProps { 
  data: any[]; 
  appLanguages: AppLanguage[];
  onToggle: (id: string) => void; 
  onEditTranslations: (item: any) => void;
}

export function CancellationReasonList({ data, appLanguages, onToggle, onEditTranslations }: CancellationReasonListProps) {
  if (!data.length) return <EmptyState title="No items configured" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Applies To</TableHeaderCell>
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
              <TableCell>{item.appliesTo.replace(/_/g, ' ')}</TableCell>
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
