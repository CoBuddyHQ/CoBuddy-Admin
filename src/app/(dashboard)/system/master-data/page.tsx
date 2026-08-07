'use client';

import { useState, useEffect } from 'react';
import { MasterListEditorTemplate } from '@/components/templates/MasterListEditorTemplate';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { CityList, InterestList, LanguageList } from '@/modules/system/master-data/components/MasterDataLists';
import { AddCityModal, AddInterestModal, AddLanguageModal } from '@/modules/system/master-data/components/MasterDataModals';

export default function MasterDataPage() {
  const { 
    cities, interests, languages, isLoading,
    toggleCity, toggleInterest, toggleLanguage,
    addCity, addInterest, addLanguage
  } = useMasterData();

  const [activeTab, setActiveTab] = useState('cities');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (useMasterData().defaults) {
      setFormData(useMasterData().defaults);
    }
  }, [useMasterData().defaults]);

  const handleSubmitDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) useMasterData().updateDefaults(formData);
  };

  if (isLoading || (useMasterData().defaults && !formData)) return <div className="p-6">Loading master data...</div>;

  return (
    <>
      <MasterListEditorTemplate
        title="Master Data Management"
        description="Manage system-wide configuration lists for app dropdowns."
        onAddClick={() => setIsModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          {
            id: 'cities',
            label: 'Cities',
            content: <CityList data={cities} onToggle={toggleCity} />
          },
          {
            id: 'interests',
            label: 'Interests & Cuisines',
            content: <InterestList data={interests} onToggle={toggleInterest} />
          },
          {
            id: 'languages',
            label: 'Languages',
            content: <LanguageList data={languages} onToggle={toggleLanguage} />
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
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData?.defaultCurrency || ''} 
                        onChange={e => setFormData({ ...formData, defaultCurrency: e.target.value })} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Default Language</label>
                      <input 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData?.defaultLanguage || ''} 
                        onChange={e => setFormData({ ...formData, defaultLanguage: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={useMasterData().isUpdatingDefaults}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
                  >
                    {useMasterData().isUpdatingDefaults ? 'Saving...' : 'Save Defaults'}
                  </button>
                </form>
              </div>
            )
          }
        ]}
      />

      <AddCityModal 
        open={isModalOpen && activeTab === 'cities'} 
        onOpenChange={setIsModalOpen} 
        onSubmit={addCity} 
      />
      <AddInterestModal 
        open={isModalOpen && activeTab === 'interests'} 
        onOpenChange={setIsModalOpen} 
        onSubmit={addInterest} 
      />
      <AddLanguageModal 
        open={isModalOpen && activeTab === 'languages'} 
        onOpenChange={setIsModalOpen} 
        onSubmit={addLanguage} 
      />
    </>
  );
}
