import {
  PrismaClient,
  StaffRole,
  EmployeeDepartment,
  EmployeeStatus,
  InviteStatus,
  InterestType,
  ReviewTagPolarity,
  ReviewTagAppliesTo,
  CancellationReasonAppliesTo,
  BookingStatus,
  VerificationStatus,
  VerificationApplicantType,
  KYCProvider,
  ReportStatus,
  BanDuration,
  ReviewModerationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  throw new Error('Demo seeding is disabled outside development/test.');
}
const DEFAULT_PASSWORD = process.env.SEED_DEMO_PASSWORD;
if (!DEFAULT_PASSWORD || DEFAULT_PASSWORD.length < 12) {
  throw new Error(
    'Set SEED_DEMO_PASSWORD to a unique password of at least 12 characters before seeding demo data.',
  );
}
const SALT_ROUNDS = 12;

async function hash(pw: string) {
  return bcrypt.hash(pw, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting CoBuddy backend seed...');

  const defaultPw = await hash(DEFAULT_PASSWORD!);

  // ============================================================
  // 1. MASTER DATA: System Defaults
  // ============================================================
  console.log('1/16 System defaults...');
  await prisma.systemDefault.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      defaultCurrency: 'INR',
      defaultLanguage: 'en',
      serviceHoursOpen: '08:00',
      serviceHoursClose: '23:00',
      platformFeePercent: 20,
    },
  });

  // ============================================================
  // 2. CITIES + AREAS (10 cities)
  // ============================================================
  console.log('2/16 Cities & Areas...');
  const citiesData = [
    {
      id: 'CITY-1',
      cityCode: 'BOM',
      name: { en: 'Mumbai', hi: 'मुंबई' },
      state: 'Maharashtra',
      lat: 19.076,
      lng: 72.8777,
    },
    {
      id: 'CITY-2',
      cityCode: 'DEL',
      name: { en: 'Delhi', hi: 'दिल्ली' },
      state: 'Delhi',
      lat: 28.6139,
      lng: 77.209,
    },
    {
      id: 'CITY-3',
      cityCode: 'BLR',
      name: { en: 'Bangalore', hi: 'बैंगलोर' },
      state: 'Karnataka',
      lat: 12.9716,
      lng: 77.5946,
    },
    {
      id: 'CITY-4',
      cityCode: 'PNQ',
      name: { en: 'Pune', hi: 'पुणे' },
      state: 'Maharashtra',
      lat: 18.5204,
      lng: 73.8567,
    },
    {
      id: 'CITY-5',
      cityCode: 'HYD',
      name: { en: 'Hyderabad', hi: 'हैदराबाद' },
      state: 'Telangana',
      lat: 17.385,
      lng: 78.4867,
    },
    {
      id: 'CITY-6',
      cityCode: 'MAA',
      name: { en: 'Chennai', hi: 'चेन्नई' },
      state: 'Tamil Nadu',
      lat: 13.0827,
      lng: 80.2707,
    },
    {
      id: 'CITY-7',
      cityCode: 'CCU',
      name: { en: 'Kolkata', hi: 'कोलकाता' },
      state: 'West Bengal',
      lat: 22.5726,
      lng: 88.3639,
    },
    {
      id: 'CITY-8',
      cityCode: 'AMD',
      name: { en: 'Ahmedabad', hi: 'अहमदाबाद' },
      state: 'Gujarat',
      lat: 23.0225,
      lng: 72.5714,
    },
    {
      id: 'CITY-9',
      cityCode: 'JAI',
      name: { en: 'Jaipur', hi: 'जयपुर' },
      state: 'Rajasthan',
      lat: 26.9124,
      lng: 75.7873,
    },
    {
      id: 'CITY-10',
      cityCode: 'STV',
      name: { en: 'Surat', hi: 'सूरत' },
      state: 'Gujarat',
      lat: 21.1702,
      lng: 72.8311,
    },
  ];

  for (const c of citiesData) {
    await prisma.city.upsert({
      where: { id: c.id },
      update: { ...c },
      create: { ...c },
    });
  }

  const areasData = [
    { id: 'AREA-1', cityId: 'CITY-1', name: { en: 'Bandra', hi: 'बांद्रा' } },
    { id: 'AREA-2', cityId: 'CITY-1', name: { en: 'Andheri', hi: 'अंधेरी' } },
    { id: 'AREA-3', cityId: 'CITY-2', name: { en: 'Connaught Place' } },
    { id: 'AREA-4', cityId: 'CITY-3', name: { en: 'Indiranagar' } },
  ];
  for (const a of areasData) {
    await prisma.area.upsert({
      where: { id: a.id },
      update: { ...a },
      create: { ...a },
    });
  }

  // ============================================================
  // 3. INTERESTS (13)
  // ============================================================
  console.log('3/16 Interests...');
  const interestsData = [
    {
      id: 'INT-1',
      name: { en: 'Italian Cuisine', hi: 'इटालियन' },
      type: InterestType.CUISINE,
      basePriceMultiplier: 1.0,
    },
    {
      id: 'INT-2',
      name: { en: 'Museums', hi: 'संग्रहालय' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.2,
    },
    {
      id: 'INT-3',
      name: { en: 'Cafe Hopping', hi: 'कैफे घूमना' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.0,
    },
    {
      id: 'INT-4',
      name: { en: 'Movies', hi: 'फिल्में' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.0,
    },
    {
      id: 'INT-5',
      name: { en: 'Concerts', hi: 'समारोह' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.5,
    },
    {
      id: 'INT-6',
      name: { en: 'Parks', hi: 'पार्क' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.0,
    },
    {
      id: 'INT-7',
      name: { en: 'Sightseeing', hi: 'दर्शनीय स्थल' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.2,
    },
    {
      id: 'INT-8',
      name: { en: 'Clubbing', hi: 'क्लबिंग' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.5,
    },
    {
      id: 'INT-9',
      name: { en: 'Art Galleries', hi: 'कला दीर्घाएँ' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.2,
    },
    {
      id: 'INT-10',
      name: { en: 'Hiking', hi: 'हाइकिंग' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.5,
    },
    {
      id: 'INT-11',
      name: { en: 'Board Games', hi: 'बोर्ड गेम्स' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.0,
    },
    {
      id: 'INT-12',
      name: { en: 'Karaoke', hi: 'कराओके' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.2,
    },
    {
      id: 'INT-13',
      name: { en: 'Gaming', hi: 'गेमिंग' },
      type: InterestType.ACTIVITY,
      basePriceMultiplier: 1.0,
    },
  ];
  for (const i of interestsData) {
    await prisma.interest.upsert({ where: { id: i.id }, update: { ...i }, create: { ...i } });
  }

  // ============================================================
  // 4. SPOKEN LANGUAGES (15)
  // ============================================================
  console.log('4/16 Spoken languages...');
  const spokenLangs = [
    { id: 'LANG-1', code: 'HI', name: 'Hindi' },
    { id: 'LANG-2', code: 'EN', name: 'English' },
    { id: 'LANG-3', code: 'HING', name: 'Hinglish' },
    { id: 'LANG-4', code: 'BN', name: 'Bengali' },
    { id: 'LANG-5', code: 'MR', name: 'Marathi' },
    { id: 'LANG-6', code: 'TE', name: 'Telugu' },
    { id: 'LANG-7', code: 'TA', name: 'Tamil' },
    { id: 'LANG-8', code: 'GU', name: 'Gujarati' },
    { id: 'LANG-9', code: 'UR', name: 'Urdu' },
    { id: 'LANG-10', code: 'KN', name: 'Kannada' },
    { id: 'LANG-11', code: 'OR', name: 'Odia' },
    { id: 'LANG-12', code: 'ML', name: 'Malayalam' },
    { id: 'LANG-13', code: 'PA', name: 'Punjabi' },
    { id: 'LANG-14', code: 'FR', name: 'French' },
    { id: 'LANG-15', code: 'ES', name: 'Spanish' },
  ];
  for (const l of spokenLangs) {
    await prisma.spokenLanguage.upsert({ where: { id: l.id }, update: { ...l }, create: { ...l } });
  }

  // ============================================================
  // 5. APP LANGUAGES (5)
  // ============================================================
  console.log('5/16 App languages...');
  const appLangs = [
    { id: 'ALANG-1', code: 'en', name: 'English' },
    { id: 'ALANG-2', code: 'hi', name: 'Hindi' },
    { id: 'ALANG-3', code: 'mr', name: 'Marathi' },
    { id: 'ALANG-4', code: 'gu', name: 'Gujarati' },
    { id: 'ALANG-5', code: 'bn', name: 'Bengali' },
  ];
  for (const a of appLangs) {
    await prisma.appLanguage.upsert({ where: { id: a.id }, update: { ...a }, create: { ...a } });
  }

  // ============================================================
  // 6. TICKET CATEGORIES (10)
  // ============================================================
  console.log('6/16 Ticket categories...');
  const ticketCats = [
    { id: 'TC-1', code: 'payment_payout', label: { en: 'Payment & Payout', hi: 'भुगतान' } },
    {
      id: 'TC-2',
      code: 'booking_session',
      label: { en: 'Booking & Session Issue', hi: 'बुकिंग समस्या' },
    },
    { id: 'TC-3', code: 'safety_incident', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' } },
    { id: 'TC-4', code: 'verification', label: { en: 'Verification', hi: 'सत्यापन' } },
    {
      id: 'TC-5',
      code: 'account_access',
      label: { en: 'Account & Tech Support', hi: 'खाता सहायता' },
    },
    { id: 'TC-6', code: 'dispute', label: { en: 'Dispute', hi: 'विवाद' } },
    { id: 'TC-7', code: 'general', label: { en: 'General', hi: 'सामान्य' } },
    {
      id: 'TC-8',
      code: 'age_minor_escalation',
      label: { en: 'Age / Minor Escalation', hi: 'आयु / नाबालिग वृद्धि' },
    },
    {
      id: 'TC-9',
      code: 'marketing_promo',
      label: { en: 'Promotions & Offers', hi: 'प्रचार और ऑफर' },
    },
    {
      id: 'TC-10',
      code: 'feedback',
      label: { en: 'Feedback & Suggestions', hi: 'प्रतिक्रिया और सुझाव' },
    },
  ];
  for (const t of ticketCats) {
    await prisma.ticketCategory.upsert({ where: { id: t.id }, update: { ...t }, create: { ...t } });
  }

  // ============================================================
  // 7. INCIDENT TYPES (12)
  // ============================================================
  console.log('7/16 Incident types...');
  const incidentTypes = [
    { id: 'IT-1', code: 'harassment', label: { en: 'Harassment', hi: 'उत्पीड़न' } },
    { id: 'IT-2', code: 'safety_concern', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' } },
    { id: 'IT-3', code: 'no_show', label: { en: 'No Show', hi: 'कोई उपस्थिति नहीं' } },
    { id: 'IT-4', code: 'payment_dispute', label: { en: 'Payment Dispute', hi: 'भुगतान विवाद' } },
    {
      id: 'IT-5',
      code: 'inappropriate_behavior',
      label: { en: 'Inappropriate Behavior', hi: 'अनुचित व्यवहार' },
    },
    { id: 'IT-6', code: 'emergency', label: { en: 'Emergency', hi: 'आपातकाल' } },
    {
      id: 'IT-7',
      code: 'unauthorized_recording',
      label: { en: 'Unauthorized Recording', hi: 'अनधिकृत रिकॉर्डिंग' },
    },
    {
      id: 'IT-8',
      code: 'privacy_violation',
      label: { en: 'Privacy Violation', hi: 'गोपनीयता उल्लंघन' },
    },
    { id: 'IT-9', code: 'scam', label: { en: 'Scam/Fraud', hi: 'घोटाला/धोखाधड़ी' } },
    {
      id: 'IT-10',
      code: 'no_show_customer',
      label: { en: 'Customer No-Show', hi: 'ग्राहक कोई उपस्थिति नहीं' },
    },
    { id: 'IT-11', code: 'other', label: { en: 'Other', hi: 'अन्य' } },
    {
      id: 'IT-12',
      code: 'identity_mismatch',
      label: { en: 'Identity Mismatch / Fake Profile', hi: 'पहचान बेमेल / नकली प्रोफ़ाइल' },
    },
  ];
  for (const i of incidentTypes) {
    await prisma.incidentType.upsert({ where: { id: i.id }, update: { ...i }, create: { ...i } });
  }

  // ============================================================
  // 8. COMMUNICATION STYLES (5)
  // ============================================================
  console.log('8/16 Communication styles...');
  const commStyles = [
    { id: 'CS-1', code: 'chatty', label: { en: 'Chatty', hi: 'बातूनी' } },
    { id: 'CS-2', code: 'balanced', label: { en: 'Balanced', hi: 'संतुलित' } },
    {
      id: 'CS-3',
      code: 'comfortable_with_quiet',
      label: { en: 'Comfortable with quiet', hi: 'शांत वातावरण में सहज' },
    },
    {
      id: 'CS-4',
      code: 'deep_conversations',
      label: { en: 'Deep Conversations', hi: 'गहरी बातचीत' },
    },
    { id: 'CS-5', code: 'listener', label: { en: 'Good Listener', hi: 'अच्छा श्रोता' } },
  ];
  for (const c of commStyles) {
    await prisma.communicationStyleOption.upsert({
      where: { id: c.id },
      update: { ...c },
      create: { ...c },
    });
  }

  // ============================================================
  // 9. ACTIVITY PACE (5)
  // ============================================================
  console.log('9/16 Activity pace options...');
  const paceOptions = [
    { id: 'AP-1', code: 'relaxed', label: { en: 'Relaxed', hi: 'आरामदायक' } },
    { id: 'AP-2', code: 'moderate', label: { en: 'Moderate', hi: 'मध्यम' } },
    { id: 'AP-3', code: 'active', label: { en: 'Active', hi: 'सक्रिय' } },
    { id: 'AP-4', code: 'very_active', label: { en: 'Very Active', hi: 'बहुत सक्रिय' } },
    { id: 'AP-5', code: 'slow_paced', label: { en: 'Slow Paced', hi: 'धीमी गति' } },
  ];
  for (const a of paceOptions) {
    await prisma.activityPaceOption.upsert({
      where: { id: a.id },
      update: { ...a },
      create: { ...a },
    });
  }

  // ============================================================
  // 10. SESSION DURATIONS (10)
  // ============================================================
  console.log('10/16 Session durations...');
  const durations = [
    { id: 'SD-1', minutes: 60, label: { en: '1 Hour', hi: '1 घंटा' } },
    { id: 'SD-2', minutes: 90, label: { en: '1.5 Hours', hi: '1.5 घंटे' } },
    { id: 'SD-3', minutes: 120, label: { en: '2 Hours', hi: '2 घंटे' } },
    { id: 'SD-4', minutes: 180, label: { en: '3 Hours', hi: '3 घंटे' } },
    { id: 'SD-5', minutes: 240, label: { en: '4 Hours', hi: '4 घंटे' } },
    { id: 'SD-6', minutes: 300, label: { en: '5 Hours', hi: '5 घंटे' } },
    { id: 'SD-7', minutes: 360, label: { en: '6 Hours', hi: '6 घंटे' } },
    { id: 'SD-8', minutes: 480, label: { en: '8 Hours', hi: '8 घंटे' } },
    { id: 'SD-9', minutes: 720, label: { en: '12 Hours', hi: '12 घंटे' } },
    { id: 'SD-10', minutes: 1440, label: { en: '24 Hours', hi: '24 घंटे' } },
  ];
  for (const s of durations) {
    await prisma.sessionDurationOption.upsert({
      where: { id: s.id },
      update: { ...s },
      create: { ...s },
    });
  }

  // ============================================================
  // 11. NOTIFICATION CATEGORIES (11)
  // ============================================================
  console.log('11/16 Notification categories...');
  const notifCats = [
    { id: 'NC-1', code: 'request', label: { en: 'Request', hi: 'अनुरोध' } },
    { id: 'NC-2', code: 'session', label: { en: 'Session', hi: 'सत्र' } },
    { id: 'NC-3', code: 'safety', label: { en: 'Safety', hi: 'सुरक्षा' } },
    { id: 'NC-4', code: 'payout', label: { en: 'Payout', hi: 'भुगतान' } },
    { id: 'NC-5', code: 'support', label: { en: 'Support', hi: 'समर्थन' } },
    { id: 'NC-6', code: 'policy', label: { en: 'Policy', hi: 'नीति' } },
    { id: 'NC-7', code: 'training', label: { en: 'Training', hi: 'प्रशिक्षण' } },
    { id: 'NC-8', code: 'system', label: { en: 'System', hi: 'प्रणाली' } },
    { id: 'NC-9', code: 'wallet', label: { en: 'Wallet', hi: 'वॉलेट' } },
    { id: 'NC-10', code: 'promotion', label: { en: 'Promotion', hi: 'प्रचार' } },
    { id: 'NC-11', code: 'reminder', label: { en: 'Reminder', hi: 'अनुस्मारक' } },
  ];
  for (const n of notifCats) {
    await prisma.notificationCategoryOption.upsert({
      where: { id: n.id },
      update: { ...n },
      create: { ...n },
    });
  }

  // ============================================================
  // 12. REVIEW TAGS (13)
  // ============================================================
  console.log('12/16 Review tags...');
  const reviewTags = [
    {
      id: 'RT-1',
      code: 'punctual',
      label: { en: 'Punctual', hi: 'समय पर' },
      polarity: ReviewTagPolarity.PRAISE,
      appliesTo: ReviewTagAppliesTo.BOTH,
    },
    {
      id: 'RT-2',
      code: 'late',
      label: { en: 'Late', hi: 'देर से आए' },
      polarity: ReviewTagPolarity.CONCERN,
      appliesTo: ReviewTagAppliesTo.BOTH,
    },
    {
      id: 'RT-3',
      code: 'rude_unprofessional',
      label: { en: 'Rude / Unprofessional', hi: 'असभ्य / अव्यावसायिक' },
      polarity: ReviewTagPolarity.CONCERN,
      appliesTo: ReviewTagAppliesTo.BOTH,
    },
    {
      id: 'RT-4',
      code: 'made_uncomfortable',
      label: { en: 'Made me uncomfortable', hi: 'मुझे असहज किया' },
      polarity: ReviewTagPolarity.CONCERN,
      appliesTo: ReviewTagAppliesTo.BOTH,
    },
    {
      id: 'RT-5',
      code: 'respectful',
      label: { en: 'Respectful', hi: 'सम्मानजनक' },
      polarity: ReviewTagPolarity.PRAISE,
      appliesTo: ReviewTagAppliesTo.COMPANION_RATING_CUSTOMER,
    },
    {
      id: 'RT-6',
      code: 'good_communicator',
      label: { en: 'Good Communicator', hi: 'अच्छा संचारक' },
      polarity: ReviewTagPolarity.PRAISE,
      appliesTo: ReviewTagAppliesTo.COMPANION_RATING_CUSTOMER,
    },
    {
      id: 'RT-7',
      code: 'fun',
      label: { en: 'Fun', hi: 'मज़ेदार' },
      polarity: ReviewTagPolarity.PRAISE,
      appliesTo: ReviewTagAppliesTo.COMPANION_RATING_CUSTOMER,
    },
    {
      id: 'RT-8',
      code: 'no_show_risk',
      label: { en: 'No-show Risk', hi: 'न आने का जोखिम' },
      polarity: ReviewTagPolarity.CONCERN,
      appliesTo: ReviewTagAppliesTo.COMPANION_RATING_CUSTOMER,
    },
    {
      id: 'RT-9',
      code: 'great_listener',
      label: { en: 'Great Listener', hi: 'अच्छा श्रोता' },
      polarity: ReviewTagPolarity.PRAISE,
      appliesTo: ReviewTagAppliesTo.CUSTOMER_RATING_COMPANION,
    },
    {
      id: 'RT-10',
      code: 'dressed_well',
      label: { en: 'Dressed Well', hi: 'अच्छे कपड़े पहने' },
      polarity: ReviewTagPolarity.PRAISE,
      appliesTo: ReviewTagAppliesTo.CUSTOMER_RATING_COMPANION,
    },
    {
      id: 'RT-11',
      code: 'safe_comforting',
      label: { en: 'Safe & Comforting', hi: 'सुरक्षित और आरामदायक' },
      polarity: ReviewTagPolarity.PRAISE,
      appliesTo: ReviewTagAppliesTo.CUSTOMER_RATING_COMPANION,
    },
    {
      id: 'RT-12',
      code: 'catfished_fake_profile',
      label: { en: 'Catfished / Fake Profile', hi: 'नकली प्रोफ़ाइल' },
      polarity: ReviewTagPolarity.CONCERN,
      appliesTo: ReviewTagAppliesTo.CUSTOMER_RATING_COMPANION,
    },
    {
      id: 'RT-13',
      code: 'boring',
      label: { en: 'Boring', hi: 'उबाऊ' },
      polarity: ReviewTagPolarity.CONCERN,
      appliesTo: ReviewTagAppliesTo.CUSTOMER_RATING_COMPANION,
    },
  ];
  for (const r of reviewTags) {
    await prisma.reviewTagOption.upsert({
      where: { id: r.id },
      update: { ...r },
      create: { ...r },
    });
  }

  // ============================================================
  // 13. DISPUTE REASONS (11)
  // ============================================================
  console.log('13/16 Dispute reasons...');
  const dispReasons = [
    {
      id: 'DR-1',
      code: 'payment_not_received',
      label: { en: 'Payment not received', hi: 'भुगतान प्राप्त नहीं हुआ' },
    },
    {
      id: 'DR-2',
      code: 'unfair_cancellation',
      label: { en: 'Unfair cancellation', hi: 'अनुचित रद्दीकरण' },
    },
    { id: 'DR-3', code: 'false_review', label: { en: 'False review', hi: 'झूठी समीक्षा' } },
    { id: 'DR-4', code: 'no_show', label: { en: 'No show', hi: 'कोई उपस्थिति नहीं' } },
    {
      id: 'DR-5',
      code: 'service_quality',
      label: { en: 'Service quality', hi: 'सेवा की गुणवत्ता' },
    },
    {
      id: 'DR-6',
      code: 'different_profile',
      label: { en: 'Companion different from profile', hi: 'साथी प्रोफ़ाइल से अलग था' },
    },
    {
      id: 'DR-7',
      code: 'early_end',
      label: { en: 'Session ended early', hi: 'सत्र जल्दी समाप्त हो गया' },
    },
    {
      id: 'DR-8',
      code: 'companion_late',
      label: { en: 'Companion was late', hi: 'साथी को देर हो गई थी' },
    },
    {
      id: 'DR-9',
      code: 'customer_late',
      label: { en: 'Customer was late', hi: 'ग्राहक को देर हो गई थी' },
    },
    { id: 'DR-10', code: 'safety_concern', label: { en: 'Safety Concern', hi: 'सुरक्षा चिंता' } },
    { id: 'DR-11', code: 'other', label: { en: 'Other', hi: 'अन्य' } },
  ];
  for (const d of dispReasons) {
    await prisma.disputeReason.upsert({ where: { id: d.id }, update: { ...d }, create: { ...d } });
  }

  // ============================================================
  // 14. CANCELLATION REASONS (14)
  // ============================================================
  console.log('14/16 Cancellation reasons...');
  const cancReasons = [
    {
      id: 'CR-1',
      code: 'schedule_conflict',
      label: { en: 'Schedule conflict', hi: 'समय का टकराव' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_REJECT,
    },
    {
      id: 'CR-2',
      code: 'location_too_far',
      label: { en: 'Location too far', hi: 'स्थान बहुत दूर है' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_REJECT,
    },
    {
      id: 'CR-3',
      code: 'not_comfortable_activity',
      label: { en: 'Not comfortable with activity', hi: 'गतिविधि के साथ असहज' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_REJECT,
    },
    {
      id: 'CR-4',
      code: 'incomplete_profile',
      label: { en: 'Incomplete profile', hi: 'अपूर्ण प्रोफ़ाइल' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_REJECT,
    },
    {
      id: 'CR-5',
      code: 'personal_emergency',
      label: { en: 'Personal emergency', hi: 'व्यक्तिगत आपातकाल' },
      appliesTo: CancellationReasonAppliesTo.ANY,
    },
    {
      id: 'CR-6',
      code: 'health_issue',
      label: { en: 'Health issue', hi: 'स्वास्थ्य समस्या' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_CANCEL,
    },
    {
      id: 'CR-7',
      code: 'transport_problem',
      label: { en: 'Transport problem', hi: 'परिवहन समस्या' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_CANCEL,
    },
    {
      id: 'CR-8',
      code: 'customer_request',
      label: { en: 'Customer request', hi: 'ग्राहक का अनुरोध' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_EARLY_END,
    },
    {
      id: 'CR-9',
      code: 'safety_concern',
      label: { en: 'Safety concern', hi: 'सुरक्षा चिंता' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_EARLY_END,
    },
    {
      id: 'CR-10',
      code: 'mutual_agreement',
      label: { en: 'Mutual agreement', hi: 'आपसी सहमति' },
      appliesTo: CancellationReasonAppliesTo.COMPANION_EARLY_END,
    },
    {
      id: 'CR-11',
      code: 'found_another_companion',
      label: { en: 'Found another companion', hi: 'एक और साथी मिल गया' },
      appliesTo: CancellationReasonAppliesTo.CUSTOMER_CANCEL,
    },
    {
      id: 'CR-12',
      code: 'booked_by_mistake',
      label: { en: 'Booked by mistake', hi: 'गलती से बुक हो गया' },
      appliesTo: CancellationReasonAppliesTo.CUSTOMER_CANCEL,
    },
    {
      id: 'CR-13',
      code: 'changed_mind',
      label: { en: 'Changed mind', hi: 'मन बदल गया' },
      appliesTo: CancellationReasonAppliesTo.CUSTOMER_CANCEL,
    },
    {
      id: 'CR-14',
      code: 'unresponsive',
      label: { en: 'Unresponsive', hi: 'अनुत्तरदायी' },
      appliesTo: CancellationReasonAppliesTo.ANY,
    },
  ];
  for (const c of cancReasons) {
    await prisma.cancellationReason.upsert({
      where: { id: c.id },
      update: { ...c },
      create: { ...c },
    });
  }

  // ============================================================
  // 15. KYC DOCUMENT TYPES (5) + PLACE TYPES (10)
  // ============================================================
  console.log('15/16 KYC & Place types...');
  const kycDocs = [
    { id: 'KYC-1', code: 'AADHAAR', label: { en: 'Aadhaar Card', hi: 'आधार कार्ड' } },
    { id: 'KYC-2', code: 'PAN', label: { en: 'PAN Card', hi: 'पैन कार्ड' } },
    { id: 'KYC-3', code: 'PASSPORT', label: { en: 'Passport', hi: 'पासपोर्ट' } },
    {
      id: 'KYC-4',
      code: 'DRIVING_LICENSE',
      label: { en: 'Driving License', hi: 'ड्राइविंग लाइसेंस' },
    },
    { id: 'KYC-5', code: 'VOTER_ID', label: { en: 'Voter ID', hi: 'मतदाता पहचान पत्र' } },
  ];
  for (const k of kycDocs) {
    await prisma.kYCDocumentType.upsert({
      where: { id: k.id },
      update: { ...k },
      create: { ...k },
    });
  }

  const placeTypes = [
    { id: 'PT-1', typeName: 'cafe', displayName: { en: 'Café', hi: 'कैफे' }, isAllowed: true },
    {
      id: 'PT-2',
      typeName: 'restaurant',
      displayName: { en: 'Restaurant', hi: 'भोजनालय' },
      isAllowed: true,
    },
    {
      id: 'PT-3',
      typeName: 'park',
      displayName: { en: 'Public Park', hi: 'सार्वजनिक पार्क' },
      isAllowed: true,
    },
    {
      id: 'PT-4',
      typeName: 'museum',
      displayName: { en: 'Gallery/Museum', hi: 'संग्रहालय' },
      isAllowed: true,
    },
    {
      id: 'PT-5',
      typeName: 'book_store',
      displayName: { en: 'Bookstore', hi: 'किताबों की दुकान' },
      isAllowed: true,
    },
    {
      id: 'PT-6',
      typeName: 'shopping_mall',
      displayName: { en: 'Shopping Mall', hi: 'शॉपिंग मॉल' },
      isAllowed: true,
    },
    {
      id: 'PT-7',
      typeName: 'lodging',
      displayName: { en: 'Hotel/Lodging', hi: 'होटल' },
      isAllowed: false,
    },
    { id: 'PT-8', typeName: 'bar', displayName: { en: 'Bar/Pub', hi: 'बार' }, isAllowed: false },
    {
      id: 'PT-9',
      typeName: 'movie_theater',
      displayName: { en: 'Movie Theater', hi: 'सिनेमा घर' },
      isAllowed: true,
    },
    {
      id: 'PT-10',
      typeName: 'amusement_park',
      displayName: { en: 'Amusement Park', hi: 'मनोरंजन पार्क' },
      isAllowed: true,
    },
  ];
  for (const p of placeTypes) {
    await prisma.placeTypeConfig.upsert({
      where: { id: p.id },
      update: { ...p },
      create: { ...p },
    });
  }

  // ============================================================
  // 16. STAFF EMPLOYEES (9) - 9 admin roles matching frontend mock
  // ============================================================
  console.log('16/16 Staff employees (9 roles)...');
  const employees: any[] = [
    {
      id: 'emp-1',
      employeeId: 'EMP-001',
      name: 'Admin User',
      email: 'admin@cobuddy.com',
      phone: '+919876543210',
      designation: 'CTO',
      department: EmployeeDepartment.MANAGEMENT,
      roles: { set: [StaffRole.SUPER_ADMIN] },
      cityScopeIds: [],
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      inviteStatus: InviteStatus.ACCEPTED,
      lastLoginAt: new Date(),
      lastLoginIp: '127.0.0.1',
    },
    {
      id: 'emp-2',
      employeeId: 'EMP-002',
      name: 'Support Lead',
      email: 'supportlead@cobuddy.com',
      phone: '+919876543211',
      designation: 'Support Manager',
      department: EmployeeDepartment.SUPPORT,
      roles: { set: [StaffRole.SUPPORT_LEAD] },
      cityScopeIds: [],
      reportingManagerId: 'emp-1',
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      inviteStatus: InviteStatus.ACCEPTED,
      lastLoginAt: new Date(),
    },
    {
      id: 'emp-3',
      employeeId: 'EMP-003',
      name: 'Junior Support',
      email: 'juniorsupport@cobuddy.com',
      phone: '+919876543212',
      designation: 'Support Agent',
      department: EmployeeDepartment.SUPPORT,
      roles: { set: [StaffRole.SUPPORT_AGENT] },
      cityScopeIds: [],
      reportingManagerId: 'emp-2',
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      inviteStatus: InviteStatus.PENDING,
    },
    {
      id: 'emp-4',
      employeeId: 'EMP-004',
      name: 'Moderator User',
      email: 'moderator@cobuddy.com',
      phone: '+919876543213',
      designation: 'Content Moderator',
      department: EmployeeDepartment.TRUST_AND_SAFETY,
      roles: { set: [StaffRole.MODERATOR] },
      cityScopeIds: [],
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      inviteStatus: InviteStatus.ACCEPTED,
    },
    {
      id: 'emp-5',
      employeeId: 'EMP-005',
      name: 'Safety Operator',
      email: 'safety@cobuddy.com',
      phone: '+919876543214',
      designation: 'Trust & Safety',
      department: EmployeeDepartment.TRUST_AND_SAFETY,
      roles: { set: [StaffRole.SAFETY_OPERATOR] },
      cityScopeIds: [],
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      inviteStatus: InviteStatus.ACCEPTED,
    },
    {
      id: 'emp-6',
      employeeId: 'EMP-006',
      name: 'Finance Admin',
      email: 'finance@cobuddy.com',
      phone: '+919876543215',
      designation: 'Finance Controller',
      department: EmployeeDepartment.FINANCE,
      roles: { set: [StaffRole.FINANCE_ADMIN] },
      cityScopeIds: [],
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      inviteStatus: InviteStatus.ACCEPTED,
    },
    {
      id: 'emp-7',
      employeeId: 'EMP-007',
      name: 'Legal Admin',
      email: 'legal@cobuddy.com',
      phone: '+919876543216',
      designation: 'Legal Counsel',
      department: EmployeeDepartment.LEGAL,
      roles: { set: [StaffRole.LEGAL_ADMIN] },
      cityScopeIds: [],
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      inviteStatus: InviteStatus.ACCEPTED,
    },
    {
      id: 'emp-8',
      employeeId: 'EMP-008',
      name: 'City Ops Manager',
      email: 'cityops@cobuddy.com',
      phone: '+919876543217',
      designation: 'Operations Manager',
      department: EmployeeDepartment.OPERATIONS,
      roles: { set: [StaffRole.CITY_OPS_MANAGER] },
      cityScopeIds: ['CITY-1'],
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      inviteStatus: InviteStatus.ACCEPTED,
    },
    {
      id: 'emp-9',
      employeeId: 'EMP-009',
      name: 'HR Admin',
      email: 'hr@cobuddy.com',
      phone: '+919876543218',
      designation: 'HR Manager',
      department: EmployeeDepartment.HR,
      roles: { set: [StaffRole.HR_ADMIN] },
      cityScopeIds: [],
      status: EmployeeStatus.ACTIVE,
      twoFactorEnabled: false,
      inviteStatus: InviteStatus.ACCEPTED,
    },
  ];
  for (const e of employees) {
    const { id, ...rest } = e;
    await prisma.staffEmployee.upsert({
      where: { id },
      update: { ...rest, passwordHash: defaultPw },
      create: { id, passwordHash: defaultPw, ...rest },
    });
  }

  // Other singleton system configs
  await prisma.verificationThreshold.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      autoApproveThreshold: 90,
      autoRejectThreshold: 30,
      livenessRequired: true,
    },
  });

  await prisma.emergencyWorkflowConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      acknowledgementSlaSeconds: 30,
      escalationSlaSeconds: 300,
      authoritiesContactIfNoResolveSeconds: 600,
      onCallTeamIds: ['emp-1', 'emp-5'],
    },
  });

  // ============================================================
  // 17. SAMPLE BOOKINGS (for testing operations pages)
  // ============================================================
  console.log('17/20 Sample bookings...');

  // Create sample customers and companions first
  const sampleCustomer = await prisma.customer.upsert({
    where: { phone: '+919876543200' },
    update: {},
    create: {
      name: 'Test Customer',
      phone: '+919876543200',
      email: 'testcustomer@example.com',
      passwordHash: defaultPw,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      cityId: 'CITY-1',
    },
  });

  const sampleCompanion = await prisma.companion.upsert({
    where: { phone: '+919876543201' },
    update: {},
    create: {
      name: 'Test Companion',
      phone: '+919876543201',
      email: 'testcompanion@example.com',
      passwordHash: defaultPw,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      cityId: 'CITY-1',
      trustScore: 75,
      pricingPerHourBase: 500,
      gender: 'Female',
    },
  });

  // Create sample venue
  await prisma.venue.upsert({
    where: { id: 'VENUE-1' },
    update: {},
    create: {
      id: 'VENUE-1',
      name: 'Sample Cafe',
      placeType: 'cafe',
      cityId: 'CITY-1',
      address: '123 Main Street, Mumbai',
      lat: 19.076,
      lng: 72.8777,
      active: true,
    },
  });

  // Create sample bookings with different statuses
  const sampleBookings = [
    {
      id: 'BOOK-1',
      bookingRef: 'CB-2026-001',
      customerId: sampleCustomer.id,
      companionId: sampleCompanion.id,
      cityId: 'CITY-1',
      venueId: 'VENUE-1',
      activityLabel: 'Coffee Date',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
      durationMins: 60,
      status: BookingStatus.IN_PROGRESS,
      bookingAmount: 500,
      platformFeePercent: 20,
      platformFeeAmount: 100,
      companionNetAmount: 400,
      paymentStatus: 'PAID',
    },
    {
      id: 'BOOK-2',
      bookingRef: 'CB-2026-002',
      customerId: sampleCustomer.id,
      companionId: sampleCompanion.id,
      cityId: 'CITY-1',
      venueId: 'VENUE-1',
      activityLabel: 'Dinner Date',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      durationMins: 60,
      status: BookingStatus.COMPLETED,
      bookingAmount: 800,
      platformFeePercent: 20,
      platformFeeAmount: 160,
      companionNetAmount: 640,
      paymentStatus: 'PAID',
    },
    {
      id: 'BOOK-3',
      bookingRef: 'CB-2026-003',
      customerId: sampleCustomer.id,
      companionId: sampleCompanion.id,
      cityId: 'CITY-1',
      venueId: 'VENUE-1',
      activityLabel: 'Movie Night',
      startTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      endTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      durationMins: 120,
      status: BookingStatus.CUSTOMER_CANCELLED,
      bookingAmount: 1000,
      platformFeePercent: 20,
      platformFeeAmount: 200,
      companionNetAmount: 800,
      paymentStatus: 'REFUNDED',
    },
    {
      id: 'BOOK-4',
      bookingRef: 'CB-2026-004',
      customerId: sampleCustomer.id,
      companionId: sampleCompanion.id,
      cityId: 'CITY-1',
      venueId: 'VENUE-1',
      activityLabel: 'Shopping Trip',
      startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      durationMins: 60,
      status: BookingStatus.ARRIVING,
      bookingAmount: 600,
      platformFeePercent: 20,
      platformFeeAmount: 120,
      companionNetAmount: 480,
      paymentStatus: 'PAID',
    },
  ];

  for (const booking of sampleBookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: booking,
      create: booking,
    });
  }

  // ============================================================
  // 18. SAMPLE VERIFICATION CASES
  // ============================================================
  console.log('18/20 Sample verification cases...');

  const sampleVerificationCases = [
    {
      id: 'VERIF-1',
      caseRef: 'VC-2026-001',
      applicantId: sampleCompanion.id,
      applicantType: VerificationApplicantType.COMPANION,
      provider: KYCProvider.HYPERVERGE,
      documentType: 'AADHAAR',
      idDocumentUrl: 'https://example.com/aadhaar-1.jpg',
      selfieUrl: 'https://example.com/selfie-1.jpg',
      status: VerificationStatus.PENDING_MANUAL_REVIEW,
      faceMatchScore: 85,
      livenessPass: true,
      documentValid: true,
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'VERIF-2',
      caseRef: 'VC-2026-002',
      applicantId: sampleCompanion.id,
      applicantType: VerificationApplicantType.COMPANION,
      provider: KYCProvider.HYPERVERGE,
      documentType: 'PASSPORT',
      idDocumentUrl: 'https://example.com/passport-1.jpg',
      selfieUrl: 'https://example.com/selfie-2.jpg',
      status: VerificationStatus.AUTO_APPROVED,
      faceMatchScore: 92,
      livenessPass: true,
      documentValid: true,
      submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      autoRunAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: 'VERIF-3',
      caseRef: 'VC-2026-003',
      applicantId: sampleCompanion.id,
      applicantType: VerificationApplicantType.COMPANION,
      provider: KYCProvider.IDFY,
      documentType: 'AADHAAR',
      idDocumentUrl: 'https://example.com/aadhaar-2.jpg',
      selfieUrl: 'https://example.com/selfie-3.jpg',
      status: VerificationStatus.AUTO_REJECTED,
      faceMatchScore: 45,
      livenessPass: false,
      documentValid: false,
      submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      autoRunAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
    },
  ];

  for (const verificationCase of sampleVerificationCases) {
    const createdCase = await prisma.verificationCase.upsert({
      where: { id: verificationCase.id },
      update: verificationCase,
      create: verificationCase,
    });

    // Create audit trail events
    if (verificationCase.caseRef === 'VC-2026-001') {
      await prisma.verificationAuditEvent.create({
        data: {
          caseId: createdCase.id,
          action: 'SUBMITTED',
          actor: 'SYSTEM',
          notes: 'Initial submission',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      });
      await prisma.verificationAuditEvent.create({
        data: {
          caseId: createdCase.id,
          action: 'AUTO_CHECK',
          actor: 'SYSTEM',
          notes: 'Auto-approved by system',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      });
    } else if (verificationCase.caseRef === 'VC-2026-002') {
      await prisma.verificationAuditEvent.create({
        data: {
          caseId: createdCase.id,
          action: 'SUBMITTED',
          actor: 'SYSTEM',
          notes: 'Initial submission',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
      });
      await prisma.verificationAuditEvent.create({
        data: {
          caseId: createdCase.id,
          action: 'AUTO_CHECK',
          actor: 'SYSTEM',
          notes: 'Auto-approved by system',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      });
    } else if (verificationCase.caseRef === 'VC-2026-003') {
      await prisma.verificationAuditEvent.create({
        data: {
          caseId: createdCase.id,
          action: 'SUBMITTED',
          actor: 'SYSTEM',
          notes: 'Initial submission',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });
      await prisma.verificationAuditEvent.create({
        data: {
          caseId: createdCase.id,
          action: 'AUTO_CHECK',
          actor: 'SYSTEM',
          notes: 'Auto-rejected due to low face match',
          timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ============================================================
  // 19. SAMPLE COMPANION APPLICATIONS
  // ============================================================
  console.log('19/20 Sample companion applications...');

  const sampleApplications = [
    {
      id: 'APP-1',
      companionId: null,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+919876543202',
      cityId: 'CITY-1',
      applicationStatus: 'PENDING',
      reviewNotes: 'Initial application received',
      portfolioUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    },
    {
      id: 'APP-2',
      companionId: null,
      firstName: 'Sarah',
      lastName: 'Smith',
      email: 'sarah.smith@example.com',
      phone: '+919876543203',
      cityId: 'CITY-1',
      applicationStatus: 'IN_REVIEW',
      reviewNotes: 'Background check in progress',
      portfolioUrls: ['https://example.com/photo3.jpg'],
    },
  ];

  for (const application of sampleApplications) {
    const existing = await prisma.companionApplication.findUnique({
      where: { id: application.id },
    });
    if (!existing) {
      await prisma.companionApplication.create({
        data: application,
      });
    }
  }

  // ============================================================
  // 20. SAMPLE MODERATION DATA
  // ============================================================
  console.log('20/20 Sample moderation data (reports, bans, reviews)...');

  // Sample user reports
  const sampleReports = [
    {
      id: 'REPORT-1',
      reportRef: 'REP-2026-001',
      reporterId: sampleCustomer.id,
      reporterType: 'CUSTOMER',
      reportedUserId: sampleCompanion.id,
      reportedUserType: 'COMPANION',
      categoryCode: 'HARASSMENT',
      status: ReportStatus.OPEN,
      description: 'Inappropriate behavior during booking',
      bookingId: 'BOOK-1',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'REPORT-2',
      reportRef: 'REP-2026-002',
      reporterId: sampleCustomer.id,
      reporterType: 'CUSTOMER',
      reportedUserId: sampleCompanion.id,
      reportedUserType: 'COMPANION',
      categoryCode: 'NO_SHOW',
      status: ReportStatus.INVESTIGATING,
      description: 'Companion did not show up for the booking',
      bookingId: 'BOOK-2',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const report of sampleReports) {
    const existing = await prisma.userReport.findUnique({
      where: { id: report.id },
    });
    if (!existing) {
      await prisma.userReport.create({
        data: report,
      });
    }
  }

  // Sample bans
  const sampleBans = [
    {
      id: 'BAN-1',
      userId: sampleCustomer.id,
      userType: 'CUSTOMER',
      reason: 'Multiple policy violations',
      duration: BanDuration.TEMPORARY_7D,
      startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      bannedById: 'emp-1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const ban of sampleBans) {
    const existing = await prisma.userBan.findUnique({
      where: { id: ban.id },
    });
    if (!existing) {
      await prisma.userBan.create({
        data: ban,
      });
    }
  }

  // Sample reviews
  const sampleReviews = [
    {
      id: 'REVIEW-1',
      byCustomerId: sampleCustomer.id,
      toCompanionId: sampleCompanion.id,
      bookingId: 'BOOK-1',
      rating: 5,
      text: 'Excellent service!',
      moderationStatus: ReviewModerationStatus.APPROVED,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'REVIEW-2',
      byCustomerId: sampleCustomer.id,
      toCompanionId: sampleCompanion.id,
      bookingId: 'BOOK-2',
      rating: 2,
      text: 'Not satisfied with the service',
      moderationStatus: ReviewModerationStatus.PENDING,
      moderationNote: 'Possible fake review',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const review of sampleReviews) {
    const existing = await prisma.review.findUnique({
      where: { id: review.id },
    });
    if (!existing) {
      await prisma.review.create({
        data: review,
      });
    }
  }

  // ============================================================
  // 21. SAMPLE SAFETY DATA
  // ============================================================
  console.log('21/21 Sample safety data (skipped - complex schema)...');

  // Skip safety data seeding due to complex schema requirements

  await prisma.discoveryRankingConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      trustScoreWeight: 0.35,
      ratingWeight: 0.25,
      responseTimeWeight: 0.15,
      acceptRateWeight: 0.1,
      sessionCompletionWeight: 0.1,
      proximityBonusWeight: 0.05,
      minTrustScoreForTopPool: 80,
      minAcceptanceRatePercent: 70,
      newCompanionBoostPercent: 20,
    },
  });

  console.log('\nSeed complete. Demo credentials use the configured SEED_DEMO_PASSWORD.');
  console.log(`   👑 SUPER_ADMIN: admin@cobuddy.com`);
  console.log(
    `   📋 Sample bookings, verification cases, companion applications, and moderation data created`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
