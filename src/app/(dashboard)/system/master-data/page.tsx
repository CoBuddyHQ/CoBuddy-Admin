'use client';

import { useState } from 'react';
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

  if (isLoading) return <div className="p-6">Loading master data...</div>;

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
