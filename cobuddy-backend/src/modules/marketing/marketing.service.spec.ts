import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.module';
import { MarketingService } from './marketing.service';

describe('Broadcast provider receipts', () => {
  const make = () => {
    const db = {
      announcement: {
        findMany: jest.fn().mockResolvedValue([]),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({
          id: 'broadcast',
          title: { en: 'Title' },
          body: { en: 'Body' },
          status: 'QUEUED',
          category: 'GENERAL',
          targetAudience: 'ALL',
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      city: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      customer: { findMany: jest.fn().mockResolvedValue([{ id: 'customer' }]) },
      companion: { findMany: jest.fn().mockResolvedValue([]) },
      broadcastDelivery: {
        createMany: jest.fn(),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'stable-delivery-id', recipientId: 'customer', recipientType: 'CUSTOMER' },
          ]),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const config = {
      get: (key: string) =>
        key === 'NOTIFICATION_DELIVERY_URL' ? 'https://provider.example.invalid' : 'server-token',
    };
    return {
      db,
      service: new MarketingService(db as unknown as PrismaService, config as ConfigService),
    };
  };
  afterEach(() => jest.restoreAllMocks());
  it('exposes only active announcements addressed to customers or everyone', async () => {
    const { db, service } = make();
    await service.activeAnnouncements();
    const query = db.announcement.findMany.mock.calls[0][0];
    const now = query.where.publishedAt.lte;
    expect(query.where).toEqual({
      isPublished: true,
      publishedAt: { lte: now },
      AND: [
        { OR: [{ targetAudience: { in: ['ALL', 'CUSTOMERS'] } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    });
  });
  it('adds a city-specific customer campaign only for one exact active city name', async () => {
    const { db, service } = make();
    db.city.findMany.mockResolvedValue([{ id: 'city-1', name: { en: 'Pune' } }]);
    db.announcement.findMany.mockResolvedValue([
      {
        id: 'city-campaign',
        title: { en: 'Pune Offer' },
        body: { en: 'Only for Pune' },
        targetAudience: 'CITY_SPECIFIC',
        category: 'PROMOTION',
        isPublished: true,
        publishedAt: new Date(),
        expiresAt: null,
        status: 'DRAFT',
      },
    ]);

    await expect(service.activeAnnouncements(' pune ')).resolves.toEqual([
      expect.objectContaining({
        id: 'city-campaign',
        targetAudience: 'CITY_SPECIFIC',
        targetCity: 'Pune',
      }),
    ]);
    expect(db.announcement.findMany.mock.calls[0][0].where.AND[0].OR).toContainEqual({
      targetAudience: 'CITY_SPECIFIC',
      targetCityIds: { has: 'city-1' },
    });
  });
  it('fails closed for duplicate city names and never includes city campaigns', async () => {
    const { db, service } = make();
    db.city.findMany.mockResolvedValue([
      { id: 'city-1', name: { en: 'Springfield' } },
      { id: 'city-2', name: { en: ' springfield ' } },
    ]);
    await service.activeAnnouncements('Springfield');
    expect(db.announcement.findMany.mock.calls[0][0].where.AND[0].OR).toEqual([
      { targetAudience: { in: ['ALL', 'CUSTOMERS'] } },
    ]);
  });
  it('exposes only active announcements addressed to companions or everyone', async () => {
    const { db, service } = make();
    await service.activeCompanionAnnouncements();
    const query = db.announcement.findMany.mock.calls[0][0];
    expect(query.where.AND[0].OR).toEqual([{ targetAudience: { in: ['ALL', 'COMPANIONS'] } }]);
    expect(query.where.isPublished).toBe(true);
  });
  it('creates a draft without publishing it or requiring the delivery gateway', async () => {
    const { db, service } = make();
    const createdAt = new Date('2026-10-17T10:00:00.000Z');
    db.announcement.create.mockResolvedValue({ id: 'draft', createdAt, isPublished: false });
    await service.create(
      {
        title: 'Campaign title',
        message: 'Campaign message',
        category: 'GENERAL',
        targetAudience: 'CUSTOMERS',
        status: 'DRAFT',
      },
      { sub: 'admin', roles: ['SUPER_ADMIN'], cityScopeIds: [] } as never,
    );
    expect(db.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT', isPublished: false }),
      }),
    );
  });
  it('publishes customer campaigns independently of notification delivery', async () => {
    const { db, service } = make();
    db.announcement.findFirst.mockResolvedValue({
      id: 'campaign',
      targetAudience: 'CUSTOMERS',
      targetCityIds: [],
      expiresAt: null,
    });
    await expect(
      service.publishAnnouncement('campaign', {
        sub: 'admin',
        roles: ['SUPER_ADMIN'],
        cityScopeIds: [],
      } as never),
    ).resolves.toMatchObject({ id: 'campaign', isPublished: true });
    expect(db.announcement.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'campaign',
          targetAudience: 'CUSTOMERS',
          targetCityIds: { equals: [] },
        }),
        data: expect.objectContaining({ isPublished: true, publishedAt: expect.any(Date) }),
      }),
    );
  });
  it('does not publish city-specific campaigns into an in-app feed without city eligibility', async () => {
    const { db, service } = make();
    db.announcement.findFirst.mockResolvedValue({
      id: 'campaign',
      targetAudience: 'CITY_SPECIFIC',
      targetCityIds: [],
      expiresAt: null,
    });
    await expect(
      service.publishAnnouncement('campaign', {
        sub: 'admin',
        roles: ['SUPER_ADMIN'],
        cityScopeIds: [],
      } as never),
    ).rejects.toThrow('Choose one active city');
    expect(db.announcement.updateMany).not.toHaveBeenCalled();
  });
  it('unpublishes a campaign immediately without changing broadcast delivery status', async () => {
    const { db, service } = make();
    await expect(
      service.unpublishAnnouncement('campaign', {
        sub: 'admin',
        roles: ['SUPER_ADMIN'],
        cityScopeIds: [],
      } as never),
    ).resolves.toEqual({ id: 'campaign', isPublished: false });
    expect(db.announcement.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'campaign', isPublished: true },
        data: { isPublished: false },
      }),
    );
  });
  it('updates published campaign content without changing its publication state', async () => {
    const { db, service } = make();
    db.announcement.findFirst.mockResolvedValue({
      isPublished: true,
      targetAudience: 'CUSTOMERS',
      targetCityIds: [],
    });
    db.announcement.updateMany.mockResolvedValue({ count: 1 });
    db.announcement.findUniqueOrThrow.mockResolvedValue({ id: 'campaign', isPublished: true });
    await service.updateAnnouncement(
      'campaign',
      {
        title: 'Updated title',
        message: 'Updated message',
        category: 'GENERAL',
        targetAudience: 'CUSTOMERS',
      },
      { sub: 'admin', roles: ['SUPER_ADMIN'], cityScopeIds: [] } as never,
    );
    expect(db.announcement.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: { en: 'Updated title' },
          body: { en: 'Updated message' },
        }),
      }),
    );
    expect(db.announcement.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'campaign' } });
  });
  it('requires explicit provider acceptance and retains its receipt', async () => {
    const { db, service } = make();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'accepted', messageId: 'receipt-1' }),
    } as Response);
    await service.dispatchDue();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://provider.example.invalid',
      expect.objectContaining({
        redirect: 'error',
        headers: expect.objectContaining({ 'Idempotency-Key': 'stable-delivery-id' }),
      }),
    );
    expect(db.broadcastDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SENT', providerId: 'receipt-1' }),
      }),
    );
  });
  it('never treats an unconfirmed 200 response as successful delivery', async () => {
    const { db, service } = make();
    db.broadcastDelivery.count.mockResolvedValue(1);
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    await service.dispatchDue();
    expect(db.broadcastDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
    expect(db.announcement.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PARTIAL', sentAt: null }),
      }),
    );
  });
  it('does not dispatch when another worker wins the claim', async () => {
    const { db, service } = make();
    db.announcement.updateMany.mockResolvedValue({ count: 0 });
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    await service.dispatchDue();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('recovers an expired sending lease using the original delivery idempotency key', async () => {
    const { db, service } = make();
    const broadcast = await db.announcement.findFirst();
    db.announcement.findFirst.mockResolvedValue({
      ...broadcast,
      status: 'SENDING',
      dispatchLeaseExpiresAt: new Date(0),
    });
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'accepted', messageId: 'original-receipt' }),
    } as Response);
    await service.dispatchDue();
    expect(db.announcement.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'SENDING',
          dispatchLeaseExpiresAt: { lte: expect.any(Date) },
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Idempotency-Key': 'stable-delivery-id' }),
      }),
    );
  });
});
