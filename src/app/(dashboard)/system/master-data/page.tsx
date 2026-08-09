'use client';

import { useState, useEffect } from 'react';
import { MasterListEditorTemplate } from '@/components/templates/MasterListEditorTemplate';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { CityList, InterestList, LanguageList, AppLanguageList } from '@/modules/system/master-data/components/MasterDataLists';
import { AddCityModal, AddInterestModal, AddLanguageModal, AddAppLanguageModal } from '@/modules/system/master-data/components/MasterDataModals';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { City, Interest } from '@/modules/system/master-data/types';

export default function MasterDataPage() {
  const { 
    cities, interests, languages, appLanguages, isLoading, defaults, isUpdatingDefaults,
    toggleCity, toggleInterest, toggleLanguage, toggleAppLanguage,
    addCity, addInterest, addLanguage, addAppLanguage, 
    addAreaToCity, toggleArea,
    updateDefaults
  } = useMasterData();

  const [activeTab, setActiveTab] = useState('cities');
  
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isAppLanguageModalOpen, setIsAppLanguageModalOpen] = useState(false);

  const [editCity, setEditCity] = useState<City | undefined>();
  const [editInterest, setEditInterest] = useState<Interest | undefined>();

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (defaults) {
      setFormData(defaults);
    }
  }, [defaults]);

  const handleSubmitDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) updateDefaults(formData);
  };

  if (isLoading || (defaults && !formData)) return <div className="p-6">Loading master data...</div>;

  const handleAddClick = () => {
    if (activeTab === 'cities') { setEditCity(undefined); setIsCityModalOpen(true); }
    else if (activeTab === 'interests') { setEditInterest(undefined); setIsInterestModalOpen(true); }
    else if (activeTab === 'languages') setIsLanguageModalOpen(true);
    else if (activeTab === 'app-languages') setIsAppLanguageModalOpen(true);
  };

  const handleEditCity = (city: City) => {
    setEditCity(city);
    setIsCityModalOpen(true);
  };

  const handleEditInterest = (interest: Interest) => {
    setEditInterest(interest);
    setIsInterestModalOpen(true);
  };

  return (
    <>
      <MasterListEditorTemplate
        title="Master Data Management"
        description="Manage system-wide configuration lists for app dropdowns."
        onAddClick={handleAddClick}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hideAddButton={activeTab === 'defaults'}
        tabs={[
          {
            id: 'cities',
            label: 'Cities',
            content: <CityList data={cities} appLanguages={appLanguages} onToggle={toggleCity} onAddArea={(cityId, areaName) => addAreaToCity({ cityId, areaName })} onToggleArea={(cityId, areaId) => toggleArea({ cityId, areaId })} onEditTranslations={handleEditCity} />
          },
          {
            id: 'interests',
            label: 'Interests & Cuisines',
            content: <InterestList data={interests} appLanguages={appLanguages} onToggle={toggleInterest} onEditTranslations={handleEditInterest} />
          },
          {
            id: 'languages',
            label: 'Spoken Languages',
            content: <LanguageList data={languages} onToggle={toggleLanguage} />
          },
          {
            id: 'app-languages',
            label: 'App Languages',
            content: <AppLanguageList data={appLanguages} onToggle={toggleAppLanguage} />
          },
          {
            id: 'defaults',
            label: 'Global Defaults',
            content: (
              <div className="p-6 max-w-2xl">
                <form onSubmit={handleSubmitDefaults} className="space-y-6 bg-card p-6 border rounded-lg shadow-sm">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Localization Defaults</h3>
                    <p className="text-sm text-muted-foreground">Set the default currency and language for new users across the platform.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Default Currency</label>
                      <input 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData?.defaultCurrency || ''} 
                        onChange={e => setFormData({ ...formData, defaultCurrency: e.target.value })} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Default Language</label>
                      <Select 
                        value={formData?.defaultLanguage || ''} 
                        onValueChange={(val) => setFormData({ ...formData, defaultLanguage: val })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Default Language" />
                        </SelectTrigger>
                        <SelectContent>
                          {appLanguages.filter(l => l.active).map(lang => (
                            <SelectItem key={lang.id} value={lang.code}>{lang.name} ({lang.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isUpdatingDefaults}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
                  >
                    {isUpdatingDefaults ? 'Saving...' : 'Save Defaults'}
                  </button>
                </form>
              </div>
            )
          }
        ]}
      />

      <AddCityModal 
        open={isCityModalOpen} 
        onOpenChange={setIsCityModalOpen} 
        onSubmit={addCity} 
        appLanguages={appLanguages}
        initialData={editCity}
      />
      <AddInterestModal 
        open={isInterestModalOpen} 
        onOpenChange={setIsInterestModalOpen} 
        onSubmit={addInterest} 
        appLanguages={appLanguages}
        initialData={editInterest}
      />
      <AddLanguageModal 
        open={isLanguageModalOpen} 
        onOpenChange={setIsLanguageModalOpen} 
        onSubmit={addLanguage} 
      />
      <AddAppLanguageModal 
        open={isAppLanguageModalOpen} 
        onOpenChange={setIsAppLanguageModalOpen} 
        onSubmit={addAppLanguage} 
      />
    </>
  );
}
