'use client';

import { useState, useEffect } from 'react';
import { MasterListEditorTemplate } from '@/components/templates/MasterListEditorTemplate';
import { useMasterData } from '@/modules/system/master-data/hooks/useMasterData';
import { CityList, InterestList, LanguageList, AppLanguageList, GenericCodeLabelList, SessionDurationList, ReviewTagList, CancellationReasonList, PlaceTypeList } from '@/modules/system/master-data/components/MasterDataLists';
import { AddCityModal, AddInterestModal, AddLanguageModal, AddAppLanguageModal, GenericCodeLabelModal, AddSessionDurationModal, AddReviewTagModal, AddCancellationReasonModal, AddPlaceTypeModal } from '@/modules/system/master-data/components/MasterDataModals';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { City, Interest, TicketCategory, IncidentType, CommunicationStyleOption, ActivityPaceOption, SessionDurationOption, NotificationCategoryOption, ReviewTagOption, DisputeReason, CancellationReason, KYCDocumentType, PlaceTypeConfig } from '@/modules/system/master-data/types';

export default function MasterDataPage() {
  const { 
    cities, interests, languages, appLanguages, isLoading, defaults, isUpdatingDefaults,
    ticketCategories, incidentTypes, communicationStyles, activityPaces, sessionDurations, notificationCategories, reviewTags, disputeReasons, cancellationReasons, kycDocumentTypes, placeTypes,
    toggleCity, toggleInterest, toggleLanguage, toggleAppLanguage,
    toggleTicketCategory, toggleIncidentType, toggleCommunicationStyle, toggleActivityPace, toggleSessionDuration, toggleNotificationCategory, toggleReviewTag, toggleDisputeReason, toggleCancellationReason, toggleKYCDocumentType, togglePlaceTypeAllowed,
    addCity, addInterest, addLanguage, addAppLanguage, 
    addTicketCategory, addIncidentType, addCommunicationStyle, addActivityPace, addSessionDuration, addNotificationCategory, addReviewTag, addDisputeReason, addCancellationReason, addKYCDocumentType,
    addAreaToCity, toggleArea,
    updateCityServiceHours,
    updatePlaceType,
    updateDefaults
  } = useMasterData();

  const [activeTab, setActiveTab] = useState('cities');
  
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isAppLanguageModalOpen, setIsAppLanguageModalOpen] = useState(false);
  const [isTicketCategoryModalOpen, setIsTicketCategoryModalOpen] = useState(false);
  const [isIncidentTypeModalOpen, setIsIncidentTypeModalOpen] = useState(false);
  const [isCommunicationStyleModalOpen, setIsCommunicationStyleModalOpen] = useState(false);
  const [isActivityPaceModalOpen, setIsActivityPaceModalOpen] = useState(false);
  const [isSessionDurationModalOpen, setIsSessionDurationModalOpen] = useState(false);
  const [isNotificationCategoryModalOpen, setIsNotificationCategoryModalOpen] = useState(false);
  const [isReviewTagModalOpen, setIsReviewTagModalOpen] = useState(false);
  const [isDisputeReasonModalOpen, setIsDisputeReasonModalOpen] = useState(false);
  const [isCancellationReasonModalOpen, setIsCancellationReasonModalOpen] = useState(false);
  const [isKYCDocumentTypeModalOpen, setIsKYCDocumentTypeModalOpen] = useState(false);
  const [isPlaceTypeModalOpen, setIsPlaceTypeModalOpen] = useState(false);

  const [editCity, setEditCity] = useState<City | undefined>();
  const [editInterest, setEditInterest] = useState<Interest | undefined>();
  const [editTicketCategory, setEditTicketCategory] = useState<TicketCategory | undefined>();
  const [editIncidentType, setEditIncidentType] = useState<IncidentType | undefined>();
  const [editCommunicationStyle, setEditCommunicationStyle] = useState<CommunicationStyleOption | undefined>();
  const [editActivityPace, setEditActivityPace] = useState<ActivityPaceOption | undefined>();
  const [editSessionDuration, setEditSessionDuration] = useState<SessionDurationOption | undefined>();
  const [editNotificationCategory, setEditNotificationCategory] = useState<NotificationCategoryOption | undefined>();
  const [editReviewTag, setEditReviewTag] = useState<ReviewTagOption | undefined>();
  const [editDisputeReason, setEditDisputeReason] = useState<DisputeReason | undefined>();
  const [editCancellationReason, setEditCancellationReason] = useState<CancellationReason | undefined>();
  const [editKYCDocumentType, setEditKYCDocumentType] = useState<KYCDocumentType | undefined>();
  const [editPlaceType, setEditPlaceType] = useState<PlaceTypeConfig | undefined>();

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
    else if (activeTab === 'ticket-categories') { setEditTicketCategory(undefined); setIsTicketCategoryModalOpen(true); }
    else if (activeTab === 'incident-types') { setEditIncidentType(undefined); setIsIncidentTypeModalOpen(true); }
    else if (activeTab === 'communication-styles') { setEditCommunicationStyle(undefined); setIsCommunicationStyleModalOpen(true); }
    else if (activeTab === 'activity-paces') { setEditActivityPace(undefined); setIsActivityPaceModalOpen(true); }
    else if (activeTab === 'session-durations') { setEditSessionDuration(undefined); setIsSessionDurationModalOpen(true); }
    else if (activeTab === 'notification-categories') { setEditNotificationCategory(undefined); setIsNotificationCategoryModalOpen(true); }
    else if (activeTab === 'review-tags') { setEditReviewTag(undefined); setIsReviewTagModalOpen(true); }
    else if (activeTab === 'dispute-reasons') { setEditDisputeReason(undefined); setIsDisputeReasonModalOpen(true); }
    else if (activeTab === 'cancellation-reasons') { setEditCancellationReason(undefined); setIsCancellationReasonModalOpen(true); }
    else if (activeTab === 'kyc-document-types') { setEditKYCDocumentType(undefined); setIsKYCDocumentTypeModalOpen(true); }
    else if (activeTab === 'place-types') { setEditPlaceType(undefined); setIsPlaceTypeModalOpen(true); }
  };

  const handleEditCity = (city: City) => {
    setEditCity(city);
    setIsCityModalOpen(true);
  };

  const handleEditInterest = (interest: Interest) => {
    setEditInterest(interest);
    setIsInterestModalOpen(true);
  };

  const handleEditTicketCategory = (item: TicketCategory) => {
    setEditTicketCategory(item);
    setIsTicketCategoryModalOpen(true);
  };

  const handleEditIncidentType = (item: IncidentType) => {
    setEditIncidentType(item);
    setIsIncidentTypeModalOpen(true);
  };

  const handleEditCommunicationStyle = (item: CommunicationStyleOption) => {
    setEditCommunicationStyle(item);
    setIsCommunicationStyleModalOpen(true);
  };

  const handleEditActivityPace = (item: ActivityPaceOption) => {
    setEditActivityPace(item);
    setIsActivityPaceModalOpen(true);
  };

  const handleEditSessionDuration = (item: SessionDurationOption) => {
    setEditSessionDuration(item);
    setIsSessionDurationModalOpen(true);
  };

  const handleEditNotificationCategory = (item: NotificationCategoryOption) => {
    setEditNotificationCategory(item);
    setIsNotificationCategoryModalOpen(true);
  };

  const handleEditReviewTag = (item: ReviewTagOption) => {
    setEditReviewTag(item);
    setIsReviewTagModalOpen(true);
  };

  const handleEditDisputeReason = (item: DisputeReason) => {
    setEditDisputeReason(item);
    setIsDisputeReasonModalOpen(true);
  };

  const handleEditCancellationReason = (item: CancellationReason) => {
    setEditCancellationReason(item);
    setIsCancellationReasonModalOpen(true);
  };

  const handleEditKYCDocumentType = (item: KYCDocumentType) => {
    setEditKYCDocumentType(item);
    setIsKYCDocumentTypeModalOpen(true);
  };

  const handleEditPlaceType = (item: PlaceTypeConfig) => {
    setEditPlaceType(item);
    setIsPlaceTypeModalOpen(true);
  };

  return (
    <>
      <MasterListEditorTemplate
        title="Master Data Management"
        description="Manage system-wide configuration lists for app dropdowns."
        onAddClick={handleAddClick}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hideAddButton={activeTab === 'defaults' || activeTab === 'place-types'} // Adding new place types is currently not exposed in the hook
        tabs={[
          {
            id: 'cities',
            label: 'Cities',
            content: <CityList data={cities} appLanguages={appLanguages} onToggle={toggleCity} onAddArea={(cityId, areaName) => addAreaToCity({ cityId, areaName })} onToggleArea={(cityId, areaId) => toggleArea({ cityId, areaId })} onEditTranslations={handleEditCity} onUpdateServiceHours={(cityId, hours) => updateCityServiceHours({ cityId, hours })} />
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
            id: 'ticket-categories',
            label: 'Ticket Categories',
            content: <GenericCodeLabelList data={ticketCategories} appLanguages={appLanguages} onToggle={toggleTicketCategory} onEditTranslations={handleEditTicketCategory} codeLabel="Code" />
          },
          {
            id: 'incident-types',
            label: 'Incident Types',
            content: <GenericCodeLabelList data={incidentTypes} appLanguages={appLanguages} onToggle={toggleIncidentType} onEditTranslations={handleEditIncidentType} codeLabel="Code" />
          },
          {
            id: 'communication-styles',
            label: 'Communication Styles',
            content: <GenericCodeLabelList data={communicationStyles} appLanguages={appLanguages} onToggle={toggleCommunicationStyle} onEditTranslations={handleEditCommunicationStyle} codeLabel="Code" />
          },
          {
            id: 'activity-paces',
            label: 'Activity Paces',
            content: <GenericCodeLabelList data={activityPaces} appLanguages={appLanguages} onToggle={toggleActivityPace} onEditTranslations={handleEditActivityPace} codeLabel="Code" />
          },
          {
            id: 'session-durations',
            label: 'Session Durations',
            content: <SessionDurationList data={sessionDurations} appLanguages={appLanguages} onToggle={toggleSessionDuration} onEditTranslations={handleEditSessionDuration} />
          },
          {
            id: 'notification-categories',
            label: 'Notification Categories',
            content: <GenericCodeLabelList data={notificationCategories} appLanguages={appLanguages} onToggle={toggleNotificationCategory} onEditTranslations={handleEditNotificationCategory} codeLabel="Code" />
          },
          {
            id: 'review-tags',
            label: 'Review Tags',
            content: <ReviewTagList data={reviewTags} appLanguages={appLanguages} onToggle={toggleReviewTag} onEditTranslations={handleEditReviewTag} />
          },
          {
            id: 'dispute-reasons',
            label: 'Dispute Reasons',
            content: <GenericCodeLabelList data={disputeReasons} appLanguages={appLanguages} onToggle={toggleDisputeReason} onEditTranslations={handleEditDisputeReason} codeLabel="Code" />
          },
          {
            id: 'cancellation-reasons',
            label: 'Cancellation Reasons',
            content: <CancellationReasonList data={cancellationReasons} appLanguages={appLanguages} onToggle={toggleCancellationReason} onEditTranslations={handleEditCancellationReason} />
          },
          {
            id: 'kyc-document-types',
            label: 'KYC Document Types',
            content: <GenericCodeLabelList data={kycDocumentTypes} appLanguages={appLanguages} onToggle={toggleKYCDocumentType} onEditTranslations={handleEditKYCDocumentType} codeLabel="Code" />
          },
          {
            id: 'place-types',
            label: 'Place Types',
            content: <PlaceTypeList data={placeTypes} appLanguages={appLanguages} onToggle={togglePlaceTypeAllowed} onEditTranslations={handleEditPlaceType} />
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
      <GenericCodeLabelModal
        open={isTicketCategoryModalOpen}
        onOpenChange={setIsTicketCategoryModalOpen}
        onSubmit={addTicketCategory}
        appLanguages={appLanguages}
        initialData={editTicketCategory}
        title="Ticket Category"
      />
      <GenericCodeLabelModal
        open={isIncidentTypeModalOpen}
        onOpenChange={setIsIncidentTypeModalOpen}
        onSubmit={addIncidentType}
        appLanguages={appLanguages}
        initialData={editIncidentType}
        title="Incident Type"
      />
      <GenericCodeLabelModal
        open={isCommunicationStyleModalOpen}
        onOpenChange={setIsCommunicationStyleModalOpen}
        onSubmit={addCommunicationStyle}
        appLanguages={appLanguages}
        initialData={editCommunicationStyle}
        title="Communication Style"
      />
      <GenericCodeLabelModal
        open={isActivityPaceModalOpen}
        onOpenChange={setIsActivityPaceModalOpen}
        onSubmit={addActivityPace}
        appLanguages={appLanguages}
        initialData={editActivityPace}
        title="Activity Pace"
      />
      <AddSessionDurationModal
        open={isSessionDurationModalOpen}
        onOpenChange={setIsSessionDurationModalOpen}
        onSubmit={addSessionDuration}
        appLanguages={appLanguages}
        initialData={editSessionDuration}
      />
      <GenericCodeLabelModal
        open={isNotificationCategoryModalOpen}
        onOpenChange={setIsNotificationCategoryModalOpen}
        onSubmit={addNotificationCategory}
        appLanguages={appLanguages}
        initialData={editNotificationCategory}
        title="Notification Category"
      />
      <AddReviewTagModal
        open={isReviewTagModalOpen}
        onOpenChange={setIsReviewTagModalOpen}
        onSubmit={addReviewTag}
        appLanguages={appLanguages}
        initialData={editReviewTag}
      />
      <GenericCodeLabelModal
        open={isDisputeReasonModalOpen}
        onOpenChange={setIsDisputeReasonModalOpen}
        onSubmit={addDisputeReason}
        appLanguages={appLanguages}
        initialData={editDisputeReason}
        title="Dispute Reason"
      />
      <AddCancellationReasonModal
        open={isCancellationReasonModalOpen}
        onOpenChange={setIsCancellationReasonModalOpen}
        onSubmit={addCancellationReason}
        appLanguages={appLanguages}
        initialData={editCancellationReason}
      />
      <GenericCodeLabelModal
        open={isKYCDocumentTypeModalOpen}
        onOpenChange={setIsKYCDocumentTypeModalOpen}
        onSubmit={addKYCDocumentType}
        appLanguages={appLanguages}
        initialData={editKYCDocumentType}
        title="KYC Document Type"
      />
      <AddPlaceTypeModal
        open={isPlaceTypeModalOpen}
        onOpenChange={setIsPlaceTypeModalOpen}
        onSubmit={(data: any) => {
          updatePlaceType(data);
          setIsPlaceTypeModalOpen(false);
        }}
        appLanguages={appLanguages}
        initialData={editPlaceType}
      />
    </>
  );
}
