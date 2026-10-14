import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  WorkflowBody,
  eventSchema,
  venueSchema,
  rankingSchema,
  activeSchema,
  ticketStatusSchema,
  notificationSchema,
  legalRequestSchema,
} from './workflow-inputs';
import { cityWhere, requireGlobal, scopedCities } from '@/common/auth/city-scope';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

const cityId = 'dcbad09c-cb72-4482-a8f1-33c79b4f8a66';
const user = (roles: string[], cityScopeIds: string[] = []): AuthStaffPayload => ({
  sub: 'staff',
  employeeId: 'staff',
  name: 'Test',
  email: 'test@example.invalid',
  roles,
  cityScopeIds,
});
describe('Admin workflow validation and scope', () => {
  const venue = {
    name: { en: 'Venue' },
    category: { en: 'Cafe' },
    city: cityId,
    address: 'Address',
    latitude: 0,
    longitude: 0,
    photoUrl: '',
  };
  it('preserves zero coordinates and optional blank image URLs', () =>
    expect(new WorkflowBody(venueSchema).transform(venue)).toEqual(venue));
  it.each([null, 'false', 0, [], {}])('rejects ambiguous booleans: %p', (active) =>
    expect(() => new WorkflowBody(activeSchema).transform({ active })).toThrow(BadRequestException),
  );
  it.each([NaN, Infinity, -91, 91, '19', null])('rejects invalid latitude: %p', (latitude) =>
    expect(venueSchema.safeParse({ ...venue, latitude }).success).toBe(false),
  );
  it.each(['http://example.com/photo', 'javascript:alert(1)', 'not-a-url'])(
    'rejects invalid or insecure image URL: %s',
    (photoUrl) => expect(venueSchema.safeParse({ ...venue, photoUrl }).success).toBe(false),
  );
  it('rejects unexpected input fields', () =>
    expect(venueSchema.safeParse({ ...venue, isActive: true }).success).toBe(false));
  it('requires event city and chronological dates', () => {
    expect(
      eventSchema.safeParse({
        title: 'Title',
        description: 'Description',
        startDate: '2027-02-30',
        endDate: '2027-03-05',
        cityId,
      }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({
        title: 'Title',
        description: 'Description',
        startDate: '2027-02-01',
        endDate: '2027-01-01',
        cityId,
      }).success,
    ).toBe(false);
  });
  it('validates the actual six ranking factors total 100', () => {
    const input = {
      trustScoreWeight: 35,
      ratingWeight: 25,
      responseTimeWeight: 15,
      acceptRateWeight: 10,
      sessionCompletionWeight: 10,
      proximityBonusWeight: 5,
      newCompanionBoostPercent: 20,
    };
    expect(rankingSchema.safeParse(input).success).toBe(true);
    expect(rankingSchema.safeParse({ ...input, ratingWeight: 24 }).success).toBe(false);
  });
  it('requires an explicit resolution note', () =>
    expect(ticketStatusSchema.safeParse({ status: 'RESOLVED', resolutionNote: ' ' }).success).toBe(
      false,
    ));
  it('requires a scheduled time and city-specific audience identifier', () => {
    expect(
      notificationSchema.safeParse({
        title: 'Hi',
        message: 'Message',
        category: 'GENERAL',
        targetAudience: 'CITY_SPECIFIC',
        status: 'DRAFT',
      }).success,
    ).toBe(false);
    expect(
      notificationSchema.safeParse({
        title: 'Hi',
        message: 'Message',
        category: 'GENERAL',
        targetAudience: 'ALL',
        status: 'SCHEDULED',
      }).success,
    ).toBe(false);
  });
  it('cannot create a request already marked as responded', () =>
    expect(
      legalRequestSchema.safeParse({
        agencyName: 'Agency',
        associatedUserId: cityId,
        deadline: '2099-01-01',
        internalNotes: '',
        requestType: 'INFO_REQUEST',
        caseReference: 'case',
        status: 'RESPONSE_SENT',
      }).success,
    ).toBe(false));
  it('keeps mixed city roles scoped and denies unassigned city operators', () => {
    expect(scopedCities(user(['CITY_OPS_MANAGER', 'MODERATOR'], [cityId]))).toEqual([cityId]);
    expect(cityWhere(user(['CITY_OPS_MANAGER']))).toEqual({ cityId: { in: [] } });
    expect(() => requireGlobal(user(['CITY_OPS_MANAGER']))).toThrow(ForbiddenException);
    expect(scopedCities(user(['SUPER_ADMIN', 'CITY_OPS_MANAGER'], [cityId]))).toBeUndefined();
  });
});
