import { City, Interest, Language, AppLanguage, SystemDefaults, TicketCategory, IncidentType, CommunicationStyleOption, ActivityPaceOption, SessionDurationOption, NotificationCategoryOption, ReviewTagOption, DisputeReason, CancellationReason, KYCDocumentType, PlaceTypeConfig } from './types';

// Note: Mobile apps should use systemConfig.serviceHours (from system/config/api.ts) to determine 
// the allowed time-range for bookings and availability. If a city has a serviceHoursOverride, 
// that should be used instead for any bookings/availability in that city.
// Effective hours = `city.serviceHoursOverride ?? systemConfig.serviceHours`.

const cities: City[] = [
  { id: 'CITY-1', name: { en: 'Mumbai', hi: 'मुंबई' }, state: 'Maharashtra', country: 'India', active: true, areas: [{ id: 'AREA-1', name: { en: 'Bandra', hi: 'बांद्रा' }, active: true }, { id: 'AREA-2', name: { en: 'Andheri', hi: 'अंधेरी' }, active: true }] },
  { id: 'CITY-2', name: { en: 'Delhi', hi: 'दिल्ली' }, state: 'Delhi', country: 'India', active: true, areas: [{ id: 'AREA-3', name: { en: 'Connaught Place' }, active: true }] },
  { id: 'CITY-3', name: { en: 'Bangalore', hi: 'बैंगलोर' }, state: 'Karnataka', country: 'India', active: true, areas: [{ id: 'AREA-4', name: { en: 'Indiranagar' }, active: true }] },
  { id: 'CITY-4', name: { en: 'Pune', hi: 'पुणे' }, state: 'Maharashtra', country: 'India', active: true, areas: [], serviceHoursOverride: { openTime: '08:00', closeTime: '20:00' } },
  { id: 'CITY-5', name: { en: 'Hyderabad', hi: 'हैदराबाद' }, state: 'Telangana', country: 'India', active: true, areas: [] },
  { id: 'CITY-6', name: { en: 'Chennai', hi: 'चेन्नई' }, state: 'Tamil Nadu', country: 'India', active: true, areas: [] },
  { id: 'CITY-7', name: { en: 'Kolkata', hi: 'कोलकाता' }, state: 'West Bengal', country: 'India', active: true, areas: [] },
  { id: 'CITY-8', name: { en: 'Ahmedabad', hi: 'अहमदाबाद' }, state: 'Gujarat', country: 'India', active: true, areas: [] },
  { id: 'CITY-9', name: { en: 'Jaipur', hi: 'जयपुर' }, state: 'Rajasthan', country: 'India', active: true, areas: [] },
  { id: 'CITY-10', name: { en: 'Surat', hi: 'सूरत' }, state: 'Gujarat', country: 'India', active: true, areas: [] },
];

const interests: Interest[] = [
  { id: 'INT-1', name: { en: 'Italian Cuisine', hi: 'इटालियन' }, type: 'CUISINE', basePriceMultiplier: 1.0, active: true },
  { id: 'INT-2', name: { en: 'Museums', hi: 'संग्रहालय' }, type: 'ACTIVITY', basePriceMultiplier: 1.2, active: true },
  { id: 'INT-3', name: { en: 'Cafe Hopping', hi: 'कैफे घूमना' }, type: 'ACTIVITY', basePriceMultiplier: 1.0, active: true },
  { id: 'INT-4', name: { en: 'Movies', hi: 'फिल्में' }, type: 'ACTIVITY', basePriceMultiplier: 1.0, active: true },
  { id: 'INT-5', name: { en: 'Concerts', hi: 'समारोह' }, type: 'ACTIVITY', basePriceMultiplier: 1.5, active: true },
  { id: 'INT-6', name: { en: 'Parks', hi: 'पार्क' }, type: 'ACTIVITY', basePriceMultiplier: 1.0, active: true },
  { id: 'INT-7', name: { en: 'Sightseeing', hi: 'दर्शनीय स्थल' }, type: 'ACTIVITY', basePriceMultiplier: 1.2, active: true },
  { id: 'INT-8', name: { en: 'Clubbing', hi: 'क्लबिंग' }, type: 'ACTIVITY', basePriceMultiplier: 1.5, active: true },
  { id: 'INT-9', name: { en: 'Art Galleries', hi: 'कला दीर्घाएँ' }, type: 'ACTIVITY', basePriceMultiplier: 1.2, active: true },
  { id: 'INT-10', name: { en: 'Hiking', hi: 'हाइकिंग' }, type: 'ACTIVITY', basePriceMultiplier: 1.5, active: true },
  { id: 'INT-11', name: { en: 'Board Games', hi: 'बोर्ड गेम्स' }, type: 'ACTIVITY', basePriceMultiplier: 1.0, active: true },
  { id: 'INT-12', name: { en: 'Karaoke', hi: 'कराओके' }, type: 'ACTIVITY', basePriceMultiplier: 1.2, active: true },
  { id: 'INT-13', name: { en: 'Gaming', hi: 'गेमिंग' }, type: 'ACTIVITY', basePriceMultiplier: 1.0, active: true },
];

const languages: Language[] = [
  { id: 'LANG-1', code: 'HI', name: 'Hindi', active: true },
  { id: 'LANG-2', code: 'EN', name: 'English', active: true },
  { id: 'LANG-3', code: 'HING', name: 'Hinglish', active: true },
  { id: 'LANG-4', code: 'BN', name: 'Bengali', active: true },
  { id: 'LANG-5', code: 'MR', name: 'Marathi', active: true },
  { id: 'LANG-6', code: 'TE', name: 'Telugu', active: true },
  { id: 'LANG-7', code: 'TA', name: 'Tamil', active: true },
  { id: 'LANG-8', code: 'GU', name: 'Gujarati', active: true },
  { id: 'LANG-9', code: 'UR', name: 'Urdu', active: true },
  { id: 'LANG-10', code: 'KN', name: 'Kannada', active: true },
  { id: 'LANG-11', code: 'OR', name: 'Odia', active: true },
  { id: 'LANG-12', code: 'ML', name: 'Malayalam', active: true },
  { id: 'LANG-13', code: 'PA', name: 'Punjabi', active: true },
  { id: 'LANG-14', code: 'FR', name: 'French', active: true },
  { id: 'LANG-15', code: 'ES', name: 'Spanish', active: true },
];

const appLanguages: AppLanguage[] = [
  { id: 'ALANG-1', code: 'en', name: 'English', active: true },
  { id: 'ALANG-2', code: 'hi', name: 'Hindi', active: true },
  { id: 'ALANG-3', code: 'mr', name: 'Marathi', active: true },
  { id: 'ALANG-4', code: 'gu', name: 'Gujarati', active: true },
  { id: 'ALANG-5', code: 'bn', name: 'Bengali', active: true },
];

const ticketCategories: TicketCategory[] = [
  { id: 'TC-1', code: 'payment_payout', label: { en: 'Payment & Payout', hi: 'भुगतान' }, active: true },
  { id: 'TC-2', code: 'booking_session', label: { en: 'Booking & Session Issue', hi: 'बुकिंग समस्या' }, active: true },
  { id: 'TC-3', code: 'safety_incident', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' }, active: true },
  { id: 'TC-4', code: 'verification', label: { en: 'Verification', hi: 'सत्यापन' }, active: true },
  { id: 'TC-5', code: 'account_access', label: { en: 'Account & Tech Support', hi: 'खाता सहायता' }, active: true },
  { id: 'TC-6', code: 'dispute', label: { en: 'Dispute', hi: 'विवाद' }, active: true },
  { id: 'TC-7', code: 'general', label: { en: 'General', hi: 'सामान्य' }, active: true },
  { id: 'TC-8', code: 'age_minor_escalation', label: { en: 'Age / Minor Escalation', hi: 'आयु / नाबालिग वृद्धि' }, active: true },
  { id: 'TC-9', code: 'marketing_promo', label: { en: 'Promotions & Offers', hi: 'प्रचार और ऑफर' }, active: true },
  { id: 'TC-10', code: 'feedback', label: { en: 'Feedback & Suggestions', hi: 'प्रतिक्रिया और सुझाव' }, active: true },
];

const incidentTypes: IncidentType[] = [
  { id: 'IT-1', code: 'harassment', label: { en: 'Harassment', hi: 'उत्पीड़न' }, active: true },
  { id: 'IT-2', code: 'safety_concern', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' }, active: true },
  { id: 'IT-3', code: 'no_show', label: { en: 'No Show', hi: 'कोई उपस्थिति नहीं' }, active: true },
  { id: 'IT-4', code: 'payment_dispute', label: { en: 'Payment Dispute', hi: 'भुगतान विवाद' }, active: true },
  { id: 'IT-5', code: 'inappropriate_behavior', label: { en: 'Inappropriate Behavior', hi: 'अनुचित व्यवहार' }, active: true },
  { id: 'IT-6', code: 'emergency', label: { en: 'Emergency', hi: 'आपातकाल' }, active: true },
  { id: 'IT-7', code: 'unauthorized_recording', label: { en: 'Unauthorized Recording', hi: 'अनधिकृत रिकॉर्डिंग' }, active: true },
  { id: 'IT-8', code: 'privacy_violation', label: { en: 'Privacy Violation', hi: 'गोपनीयता उल्लंघन' }, active: true },
  { id: 'IT-9', code: 'scam', label: { en: 'Scam/Fraud', hi: 'घोटाला/धोखाधड़ी' }, active: true },
  { id: 'IT-10', code: 'no_show_customer', label: { en: 'Customer No-Show', hi: 'ग्राहक कोई उपस्थिति नहीं' }, active: true },
  { id: 'IT-11', code: 'other', label: { en: 'Other', hi: 'अन्य' }, active: true }
];

const communicationStyles: CommunicationStyleOption[] = [
  { id: 'CS-1', code: 'chatty', label: { en: 'Chatty', hi: 'बातूनी' }, active: true },
  { id: 'CS-2', code: 'balanced', label: { en: 'Balanced', hi: 'संतुलित' }, active: true },
  { id: 'CS-3', code: 'comfortable_with_quiet', label: { en: 'Comfortable with quiet', hi: 'शांत वातावरण में सहज' }, active: true },
  { id: 'CS-4', code: 'deep_conversations', label: { en: 'Deep Conversations', hi: 'गहरी बातचीत' }, active: true },
  { id: 'CS-5', code: 'listener', label: { en: 'Good Listener', hi: 'अच्छा श्रोता' }, active: true }
];

const activityPaces: ActivityPaceOption[] = [
  { id: 'AP-1', code: 'relaxed', label: { en: 'Relaxed', hi: 'आरामदायक' }, active: true },
  { id: 'AP-2', code: 'moderate', label: { en: 'Moderate', hi: 'मध्यम' }, active: true },
  { id: 'AP-3', code: 'active', label: { en: 'Active', hi: 'सक्रिय' }, active: true },
  { id: 'AP-4', code: 'very_active', label: { en: 'Very Active', hi: 'बहुत सक्रिय' }, active: true },
  { id: 'AP-5', code: 'slow_paced', label: { en: 'Slow Paced', hi: 'धीमी गति' }, active: true }
];

const sessionDurations: SessionDurationOption[] = [
  { id: 'SD-1', minutes: 60, label: { en: '1 Hour', hi: '1 घंटा' }, active: true },
  { id: 'SD-2', minutes: 90, label: { en: '1.5 Hours', hi: '1.5 घंटे' }, active: true },
  { id: 'SD-3', minutes: 120, label: { en: '2 Hours', hi: '2 घंटे' }, active: true },
  { id: 'SD-4', minutes: 180, label: { en: '3 Hours', hi: '3 घंटे' }, active: true },
  { id: 'SD-5', minutes: 240, label: { en: '4 Hours', hi: '4 घंटे' }, active: true },
  { id: 'SD-6', minutes: 300, label: { en: '5 Hours', hi: '5 घंटे' }, active: true },
  { id: 'SD-7', minutes: 360, label: { en: '6 Hours', hi: '6 घंटे' }, active: true },
  { id: 'SD-8', minutes: 480, label: { en: '8 Hours', hi: '8 घंटे' }, active: true },
  { id: 'SD-9', minutes: 720, label: { en: '12 Hours', hi: '12 घंटे' }, active: true },
  { id: 'SD-10', minutes: 1440, label: { en: '24 Hours', hi: '24 घंटे' }, active: true }
];

const notificationCategories: NotificationCategoryOption[] = [
  { id: 'NC-1', code: 'request', label: { en: 'Request', hi: 'अनुरोध' }, active: true },
  { id: 'NC-2', code: 'session', label: { en: 'Session', hi: 'सत्र' }, active: true },
  { id: 'NC-3', code: 'safety', label: { en: 'Safety', hi: 'सुरक्षा' }, active: true },
  { id: 'NC-4', code: 'payout', label: { en: 'Payout', hi: 'भुगतान' }, active: true },
  { id: 'NC-5', code: 'support', label: { en: 'Support', hi: 'समर्थन' }, active: true },
  { id: 'NC-6', code: 'policy', label: { en: 'Policy', hi: 'नीति' }, active: true },
  { id: 'NC-7', code: 'training', label: { en: 'Training', hi: 'प्रशिक्षण' }, active: true },
  { id: 'NC-8', code: 'system', label: { en: 'System', hi: 'प्रणाली' }, active: true },
  { id: 'NC-9', code: 'wallet', label: { en: 'Wallet', hi: 'वॉलेट' }, active: true },
  { id: 'NC-10', code: 'promotion', label: { en: 'Promotion', hi: 'प्रचार' }, active: true },
  { id: 'NC-11', code: 'reminder', label: { en: 'Reminder', hi: 'अनुस्मारक' }, active: true }
];

const reviewTags: ReviewTagOption[] = [
  { id: 'RT-1', code: 'punctual', label: { en: 'Punctual', hi: 'समय पर' }, polarity: 'PRAISE', appliesTo: 'BOTH', active: true },
  { id: 'RT-2', code: 'late', label: { en: 'Late', hi: 'देर से आए' }, polarity: 'CONCERN', appliesTo: 'BOTH', active: true },
  { id: 'RT-3', code: 'rude_unprofessional', label: { en: 'Rude / Unprofessional', hi: 'असभ्य / अव्यावसायिक' }, polarity: 'CONCERN', appliesTo: 'BOTH', active: true },
  { id: 'RT-4', code: 'made_uncomfortable', label: { en: 'Made me uncomfortable', hi: 'मुझे असहज किया' }, polarity: 'CONCERN', appliesTo: 'BOTH', active: true },
  { id: 'RT-5', code: 'respectful', label: { en: 'Respectful', hi: 'सम्मानजनक' }, polarity: 'PRAISE', appliesTo: 'COMPANION_RATING_CUSTOMER', active: true },
  { id: 'RT-6', code: 'good_communicator', label: { en: 'Good Communicator', hi: 'अच्छा संचारक' }, polarity: 'PRAISE', appliesTo: 'COMPANION_RATING_CUSTOMER', active: true },
  { id: 'RT-7', code: 'fun', label: { en: 'Fun', hi: 'मज़ेदार' }, polarity: 'PRAISE', appliesTo: 'COMPANION_RATING_CUSTOMER', active: true },
  { id: 'RT-8', code: 'no_show_risk', label: { en: 'No-show Risk', hi: 'न आने का जोखिम' }, polarity: 'CONCERN', appliesTo: 'COMPANION_RATING_CUSTOMER', active: true },
  { id: 'RT-9', code: 'great_listener', label: { en: 'Great Listener', hi: 'अच्छा श्रोता' }, polarity: 'PRAISE', appliesTo: 'CUSTOMER_RATING_COMPANION', active: true },
  { id: 'RT-10', code: 'dressed_well', label: { en: 'Dressed Well', hi: 'अच्छे कपड़े पहने' }, polarity: 'PRAISE', appliesTo: 'CUSTOMER_RATING_COMPANION', active: true },
  { id: 'RT-11', code: 'safe_comforting', label: { en: 'Safe & Comforting', hi: 'सुरक्षित और आरामदायक' }, polarity: 'PRAISE', appliesTo: 'CUSTOMER_RATING_COMPANION', active: true },
  { id: 'RT-12', code: 'catfished_fake_profile', label: { en: 'Catfished / Fake Profile', hi: 'नकली प्रोफ़ाइल' }, polarity: 'CONCERN', appliesTo: 'CUSTOMER_RATING_COMPANION', active: true },
  { id: 'RT-13', code: 'boring', label: { en: 'Boring', hi: 'उबाऊ' }, polarity: 'CONCERN', appliesTo: 'CUSTOMER_RATING_COMPANION', active: true },
];

const disputeReasons: DisputeReason[] = [
  { id: 'DR-1', code: 'payment_not_received', label: { en: 'Payment not received', hi: 'भुगतान प्राप्त नहीं हुआ' }, active: true },
  { id: 'DR-2', code: 'unfair_cancellation', label: { en: 'Unfair cancellation', hi: 'अनुचित रद्दीकरण' }, active: true },
  { id: 'DR-3', code: 'false_review', label: { en: 'False review', hi: 'झूठी समीक्षा' }, active: true },
  { id: 'DR-4', code: 'no_show', label: { en: 'No show', hi: 'कोई उपस्थिति नहीं' }, active: true },
  { id: 'DR-5', code: 'service_quality', label: { en: 'Service quality', hi: 'सेवा की गुणवत्ता' }, active: true },
  { id: 'DR-6', code: 'different_profile', label: { en: 'Companion different from profile', hi: 'साथी प्रोफ़ाइल से अलग था' }, active: true },
  { id: 'DR-7', code: 'early_end', label: { en: 'Session ended early', hi: 'सत्र जल्दी समाप्त हो गया' }, active: true },
  { id: 'DR-8', code: 'companion_late', label: { en: 'Companion was late', hi: 'साथी को देर हो गई थी' }, active: true },
  { id: 'DR-9', code: 'customer_late', label: { en: 'Customer was late', hi: 'ग्राहक को देर हो गई थी' }, active: true },
  { id: 'DR-10', code: 'safety_concern', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' }, active: true },
  { id: 'DR-11', code: 'other', label: { en: 'Other', hi: 'अन्य' }, active: true }
];

const cancellationReasons: CancellationReason[] = [
  { id: 'CR-1', code: 'schedule_conflict', label: { en: 'Schedule conflict', hi: 'समय का टकराव' }, appliesTo: 'COMPANION_REJECT', active: true },
  { id: 'CR-2', code: 'location_too_far', label: { en: 'Location too far', hi: 'स्थान बहुत दूर है' }, appliesTo: 'COMPANION_REJECT', active: true },
  { id: 'CR-3', code: 'not_comfortable_activity', label: { en: 'Not comfortable with activity', hi: 'गतिविधि के साथ असहज' }, appliesTo: 'COMPANION_REJECT', active: true },
  { id: 'CR-4', code: 'incomplete_profile', label: { en: 'Incomplete profile', hi: 'अपूर्ण प्रोफ़ाइल' }, appliesTo: 'COMPANION_REJECT', active: true },
  { id: 'CR-5', code: 'personal_emergency', label: { en: 'Personal emergency', hi: 'व्यक्तिगत आपातकाल' }, appliesTo: 'ANY', active: true },
  { id: 'CR-6', code: 'health_issue', label: { en: 'Health issue', hi: 'स्वास्थ्य समस्या' }, appliesTo: 'COMPANION_CANCEL', active: true },
  { id: 'CR-7', code: 'transport_problem', label: { en: 'Transport problem', hi: 'परिवहन समस्या' }, appliesTo: 'COMPANION_CANCEL', active: true },
  { id: 'CR-8', code: 'customer_request', label: { en: 'Customer request', hi: 'ग्राहक का अनुरोध' }, appliesTo: 'COMPANION_EARLY_END', active: true },
  { id: 'CR-9', code: 'safety_concern', label: { en: 'Safety concern', hi: 'सुरक्षा चिंता' }, appliesTo: 'COMPANION_EARLY_END', active: true },
  { id: 'CR-10', code: 'mutual_agreement', label: { en: 'Mutual agreement', hi: 'आपसी सहमति' }, appliesTo: 'COMPANION_EARLY_END', active: true },
  { id: 'CR-11', code: 'found_another_companion', label: { en: 'Found another companion', hi: 'एक और साथी मिल गया' }, appliesTo: 'CUSTOMER_CANCEL', active: true },
  { id: 'CR-12', code: 'booked_by_mistake', label: { en: 'Booked by mistake', hi: 'गलती से बुक हो गया' }, appliesTo: 'CUSTOMER_CANCEL', active: true },
  { id: 'CR-13', code: 'changed_mind', label: { en: 'Changed mind', hi: 'मन बदल गया' }, appliesTo: 'CUSTOMER_CANCEL', active: true },
  { id: 'CR-14', code: 'unresponsive', label: { en: 'Unresponsive', hi: 'अनुत्तरदायी' }, appliesTo: 'ANY', active: true },
];

const kycDocumentTypes: KYCDocumentType[] = [
  { id: 'KYC-1', code: 'AADHAAR', label: { en: 'Aadhaar Card', hi: 'आधार कार्ड' }, active: true },
  { id: 'KYC-2', code: 'PAN', label: { en: 'PAN Card', hi: 'पैन कार्ड' }, active: true },
  { id: 'KYC-3', code: 'PASSPORT', label: { en: 'Passport', hi: 'पासपोर्ट' }, active: true },
  { id: 'KYC-4', code: 'DRIVING_LICENSE', label: { en: 'Driving License', hi: 'ड्राइविंग लाइसेंस' }, active: true },
  { id: 'KYC-5', code: 'VOTER_ID', label: { en: 'Voter ID', hi: 'मतदाता पहचान पत्र' }, active: true }
];

let mockPlaceTypes: PlaceTypeConfig[] = [
  { id: 'PT-1', typeName: 'cafe', displayName: { en: 'Café', hi: 'कैफे' }, isAllowed: true },
  { id: 'PT-2', typeName: 'restaurant', displayName: { en: 'Restaurant', hi: 'भोजनालय' }, isAllowed: true },
  { id: 'PT-3', typeName: 'park', displayName: { en: 'Public Park', hi: 'सार्वजनिक पार्क' }, isAllowed: true },
  { id: 'PT-4', typeName: 'museum', displayName: { en: 'Gallery/Museum', hi: 'संग्रहालय' }, isAllowed: true },
  { id: 'PT-5', typeName: 'book_store', displayName: { en: 'Bookstore', hi: 'किताबों की दुकान' }, isAllowed: true },
  { id: 'PT-6', typeName: 'shopping_mall', displayName: { en: 'Shopping Mall', hi: 'शॉपिंग मॉल' }, isAllowed: true },
  { id: 'PT-7', typeName: 'lodging', displayName: { en: 'Hotel/Lodging', hi: 'होटल' }, isAllowed: false },
  { id: 'PT-8', typeName: 'bar', displayName: { en: 'Bar/Pub', hi: 'बार' }, isAllowed: false },
  { id: 'PT-9', typeName: 'movie_theater', displayName: { en: 'Movie Theater', hi: 'सिनेमा घर' }, isAllowed: true },
  { id: 'PT-10', typeName: 'amusement_park', displayName: { en: 'Amusement Park', hi: 'मनोरंजन पार्क' }, isAllowed: true },
];

let mockDefaults: SystemDefaults = {
  defaultCurrency: 'INR',
  defaultLanguage: 'en',
};

export const masterDataApi = {
  getCities: async (): Promise<City[]> => Promise.resolve([...cities]),
  getInterests: async (): Promise<Interest[]> => Promise.resolve([...interests]),
  getLanguages: async (): Promise<Language[]> => Promise.resolve([...languages]),
  getAppLanguages: async (): Promise<AppLanguage[]> => Promise.resolve([...appLanguages]),
  getTicketCategories: async (): Promise<TicketCategory[]> => Promise.resolve([...ticketCategories]),
  getIncidentTypes: async (): Promise<IncidentType[]> => Promise.resolve([...incidentTypes]),
  getCommunicationStyles: async (): Promise<CommunicationStyleOption[]> => Promise.resolve([...communicationStyles]),
  getActivityPaces: async (): Promise<ActivityPaceOption[]> => Promise.resolve([...activityPaces]),
  getSessionDurations: async (): Promise<SessionDurationOption[]> => Promise.resolve([...sessionDurations]),
  getNotificationCategories: async (): Promise<NotificationCategoryOption[]> => Promise.resolve([...notificationCategories]),
  getReviewTags: async (): Promise<ReviewTagOption[]> => Promise.resolve([...reviewTags]),
  getDisputeReasons: async (): Promise<DisputeReason[]> => Promise.resolve([...disputeReasons]),
  getCancellationReasons: async (): Promise<CancellationReason[]> => Promise.resolve([...cancellationReasons]),
  getKYCDocumentTypes: async (): Promise<KYCDocumentType[]> => Promise.resolve([...kycDocumentTypes]),
  getPlaceTypes: async (): Promise<PlaceTypeConfig[]> => Promise.resolve([...mockPlaceTypes]),

  toggleCity: async (id: string): Promise<void> => {
    const item = cities.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleInterest: async (id: string): Promise<void> => {
    const item = interests.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleLanguage: async (id: string): Promise<void> => {
    const item = languages.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleAppLanguage: async (id: string): Promise<void> => {
    const item = appLanguages.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleTicketCategory: async (id: string): Promise<void> => {
    const item = ticketCategories.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleIncidentType: async (id: string): Promise<void> => {
    const item = incidentTypes.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleCommunicationStyle: async (id: string): Promise<void> => {
    const item = communicationStyles.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleActivityPace: async (id: string): Promise<void> => {
    const item = activityPaces.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleSessionDuration: async (id: string): Promise<void> => {
    const item = sessionDurations.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleNotificationCategory: async (id: string): Promise<void> => {
    const item = notificationCategories.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleReviewTag: async (id: string): Promise<void> => {
    const item = reviewTags.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleDisputeReason: async (id: string): Promise<void> => {
    const item = disputeReasons.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleCancellationReason: async (id: string): Promise<void> => {
    const item = cancellationReasons.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  toggleKYCDocumentType: async (id: string): Promise<void> => {
    const item = kycDocumentTypes.find(i => i.id === id);
    if (item) item.active = !item.active;
    return Promise.resolve();
  },
  togglePlaceTypeAllowed: async (id: string): Promise<void> => {
    mockPlaceTypes = mockPlaceTypes.map(p => p.id === id ? { ...p, isAllowed: !p.isAllowed } : p);
    return Promise.resolve();
  },
  updateInterestMultiplier: async (id: string, multiplier: number): Promise<void> => {
    const item = interests.find(i => i.id === id);
    if (item) item.basePriceMultiplier = multiplier;
    return Promise.resolve();
  },

  addCity: async (data: Omit<City, 'id'>): Promise<void> => {
    cities.push({ id: `CITY-${Date.now()}`, ...data, areas: [] });
    return Promise.resolve();
  },
  addInterest: async (data: Omit<Interest, 'id'>): Promise<void> => {
    interests.push({ id: `INT-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addLanguage: async (data: Omit<Language, 'id'>): Promise<void> => {
    languages.push({ id: `LANG-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addAppLanguage: async (data: Omit<AppLanguage, 'id'>): Promise<void> => {
    appLanguages.push({ id: `ALANG-${Date.now()}`, ...data });
    return Promise.resolve();
  },

  addTicketCategory: async (data: Omit<TicketCategory, 'id'>): Promise<void> => {
    ticketCategories.push({ id: `TC-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addIncidentType: async (data: Omit<IncidentType, 'id'>): Promise<void> => {
    incidentTypes.push({ id: `IT-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addCommunicationStyle: async (data: Omit<CommunicationStyleOption, 'id'>): Promise<void> => {
    communicationStyles.push({ id: `CS-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addActivityPace: async (data: Omit<ActivityPaceOption, 'id'>): Promise<void> => {
    activityPaces.push({ id: `AP-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addSessionDuration: async (data: Omit<SessionDurationOption, 'id'>): Promise<void> => {
    sessionDurations.push({ id: `SD-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addNotificationCategory: async (data: Omit<NotificationCategoryOption, 'id'>): Promise<void> => {
    notificationCategories.push({ id: `NC-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addReviewTag: async (data: Omit<ReviewTagOption, 'id'>): Promise<void> => {
    reviewTags.push({ id: `RT-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addDisputeReason: async (data: Omit<DisputeReason, 'id'>): Promise<void> => {
    disputeReasons.push({ id: `DR-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addCancellationReason: async (data: Omit<CancellationReason, 'id'>): Promise<void> => {
    cancellationReasons.push({ id: `CR-${Date.now()}`, ...data });
    return Promise.resolve();
  },
  addKYCDocumentType: async (data: Omit<KYCDocumentType, 'id'>): Promise<void> => {
    kycDocumentTypes.push({ id: `KYC-${Date.now()}`, ...data });
    return Promise.resolve();
  },

  addAreaToCity: async (cityId: string, areaName: Record<string, string>, lat?: number, lng?: number): Promise<void> => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      if (!city.areas) city.areas = [];
      city.areas.push({ id: `AREA-${Date.now()}`, name: areaName, active: true, lat, lng });
    }
    return Promise.resolve();
  },
  toggleArea: async (cityId: string, areaId: string): Promise<void> => {
    const city = cities.find(c => c.id === cityId);
    if (city && city.areas) {
      const area = city.areas.find(a => a.id === areaId);
      if (area) area.active = !area.active;
    }
    return Promise.resolve();
  },
  updateCityServiceHours: async (cityId: string, hours: { openTime: string; closeTime: string } | null): Promise<void> => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      if (hours) {
        city.serviceHoursOverride = hours;
      } else {
        city.serviceHoursOverride = null;
      }
    }
    return Promise.resolve();
  },

  getDefaults: async (): Promise<SystemDefaults> => Promise.resolve({ ...mockDefaults }),
  updateDefaults: async (defaults: SystemDefaults): Promise<void> => {
    mockDefaults = { ...defaults };
    return Promise.resolve();
  }
};
