import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { NotificationCategory, NotificationChannel } from '@prisma/client';

export class WorkflowBody implements PipeTransform {
  constructor(private readonly schema: z.ZodTypeAny) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success)
      throw new BadRequestException(
        result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      );
    return result.data;
  }
}

const text = z.string().trim().min(1).max(200);
const content = z.string().trim().min(1).max(100000);
const id = z.string().uuid();
const date = z.union([z.string().date(), z.string().datetime({ offset: true })]);
const future = date.refine((v) => Date.parse(v) > Date.now(), 'Must be in the future');
const url = z.string().url().max(2000).startsWith('https:', 'Use an HTTPS URL');
const optionalUrl = z.union([url, z.literal('')]).optional();
const localized = z
  .record(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/), content)
  .refine((v) => !!v.en, 'English text is required');
const pct = z.number().finite().min(0).max(100);
export const eventSchema = z
  .object({
    cityId: id,
    title: text,
    description: content,
    imageUrl: optionalUrl,
    linkedCategory: z.string().trim().max(200).optional(),
    startDate: date,
    endDate: date,
  })
  .strict()
  .refine(
    (v) => Date.parse(v.endDate) >= Date.parse(v.startDate),
    'End date must follow start date',
  );
export const venueSchema = z
  .object({
    name: localized,
    category: localized,
    address: text,
    city: id,
    photoUrl: optionalUrl,
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();
export const activeSchema = z.object({ active: z.boolean() }).strict();
export const rankingSchema = z
  .object({
    trustScoreWeight: pct,
    ratingWeight: pct,
    responseTimeWeight: pct,
    acceptRateWeight: pct,
    sessionCompletionWeight: pct,
    proximityBonusWeight: pct,
    newCompanionBoostPercent: pct,
  })
  .strict()
  .refine(
    (v) =>
      Math.abs(
        v.trustScoreWeight +
          v.ratingWeight +
          v.responseTimeWeight +
          v.acceptRateWeight +
          v.sessionCompletionWeight +
          v.proximityBonusWeight -
          100,
      ) < 0.0001,
    'Ranking weights must total 100%',
  );
export const uiSchema = z
  .object({
    enableDarkThemeDefault: z.boolean(),
    homeScreenLayout: z.enum(['GRID', 'LIST', 'MAP_FIRST']),
    featuredSectionTitle: text,
    maxFeaturedCompanions: z.number().int().min(1).max(100),
  })
  .strict();
export const promotionSchema = z.object({ companionId: id, promotedUntil: future }).strict();
export const launchSchema = z
  .object({ cityName: text, region: text, targetLaunchDate: date, managerName: text })
  .strict();
export const launchStatusSchema = z
  .object({ status: z.enum(['PLANNING', 'IN_PROGRESS', 'READY', 'LIVE']) })
  .strict();
export const checklistSchema = z.object({ completed: z.boolean() }).strict();
export const waitlistConfigSchema = z
  .object({
    requireInviteCode: z.boolean(),
    autoApproveWaitlist: z.boolean(),
    maxDailyInvites: z.number().int().min(0).max(10000),
  })
  .strict();
export const waitlistSchema = z
  .object({ email: z.string().email().max(254), phone: z.string().min(5).max(30), cityId: id })
  .strict();
export const abuseStatusSchema = z
  .object({ status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED']) })
  .strict();
export const abuseActionSchema = z
  .object({ action: z.enum(['BLOCK_REFERRAL', 'BAN_ACCOUNTS']) })
  .strict();
export const policySchema = z
  .object({
    title: localized,
    content: localized,
    type: z.enum(['TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COMMUNITY_GUIDELINES', 'REFUND_POLICY']),
  })
  .strict();
export const policyStatusSchema = z
  .object({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) })
  .strict();
export const legalSettingsSchema = z
  .object({
    contactEmail: z.string().email(),
    supportPhone: z.string().max(30),
    termsUrl: z.union([url, z.literal('')]),
    privacyUrl: z.union([url, z.literal('')]),
  })
  .strict();
export const lessonSchema = z
  .object({
    title: localized,
    content: localized,
    category: z.enum(['SAFETY', 'ONBOARDING', 'BEST_PRACTICES']),
  })
  .strict();
export const lessonStatusSchema = z.object({ status: z.enum(['DRAFT', 'PUBLISHED']) }).strict();
export const ticketStatusSchema = z
  .object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    resolutionNote: z.string().trim().max(5000).optional(),
  })
  .strict()
  .refine(
    (v) => !['RESOLVED', 'CLOSED'].includes(v.status) || !!v.resolutionNote,
    'A resolution note is required',
  );
export const replySchema = z.object({ message: z.string().trim().min(1).max(10000) }).strict();
export const assignmentSchema = z.object({ staffId: id.nullable() }).strict();
export const ticketSchema = z
  .object({
    userId: id,
    userType: z.enum(['CUSTOMER', 'COMPANION']),
    categoryCode: text,
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    subject: text,
    message: content,
    slaDeadline: date.optional(),
  })
  .strict();
export const privacySchema = z
  .object({
    userId: id,
    userType: z.enum(['CUSTOMER', 'COMPANION']),
    requestType: z.enum(['DATA_EXPORT', 'ACCOUNT_DELETION']),
  })
  .strict();
export const privacyStatusSchema = z
  .object({ status: z.enum(['PENDING', 'PROCESSING', 'FULFILLED', 'REJECTED']) })
  .strict();
export const holdSchema = z.object({ legalHold: z.boolean() }).strict();
export const legalRequestSchema = z
  .object({
    agencyName: text,
    requestType: z.enum(['SUBPOENA', 'SUMMONS', 'INFO_REQUEST', 'WARRANT']),
    associatedUserId: id,
    userType: z.enum(['CUSTOMER', 'COMPANION']).default('CUSTOMER'),
    deadline: date,
    internalNotes: z.string().max(10000),
    documentUrls: z.array(url).max(20).default([]),
    caseReference: text,
    status: z.literal('OPEN').default('OPEN'),
  })
  .strict();
export const legalStatusSchema = z
  .object({ status: z.enum(['OPEN', 'EVIDENCE_PRESERVED', 'RESPONSE_SENT', 'CLOSED']) })
  .strict();
export const notificationSchema = z
  .object({
    title: text,
    message: z.string().trim().min(1).max(4000),
    category: text,
    targetAudience: z.enum(['ALL', 'CUSTOMERS', 'COMPANIONS', 'CITY_SPECIFIC']),
    targetCity: id.optional(),
    status: z.enum(['DRAFT', 'SCHEDULED']),
    scheduledFor: future.optional(),
  })
  .strict()
  .refine((v) => v.targetAudience !== 'CITY_SPECIFIC' || !!v.targetCity, 'Choose a city')
  .refine((v) => v.status !== 'SCHEDULED' || !!v.scheduledFor, 'Choose a scheduled time');

export type EventInput = z.infer<typeof eventSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type RankingInput = z.infer<typeof rankingSchema>;
export type LaunchInput = z.infer<typeof launchSchema>;
export type PolicyInput = z.infer<typeof policySchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
export type LegalInput = z.infer<typeof legalRequestSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export const templateSchema = z
  .object({
    templateKey: text,
    category: z.nativeEnum(NotificationCategory),
    subject: localized,
    body: localized,
    channels: z.array(z.nativeEnum(NotificationChannel)).min(1).max(4),
    active: z.boolean(),
  })
  .strict();
export const referralSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Z0-9_-]{3,40}$/),
    ownerId: id,
    ownerType: z.enum(['CUSTOMER', 'COMPANION']),
    signupBonus: z.number().min(0).max(10000),
    refereeBonus: z.number().min(0).max(10000),
    maxUsages: z.number().int().min(1).max(100000),
  })
  .strict();
