import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.module';
import { MarketingService } from './marketing.service';

describe('Broadcast provider receipts', () => {
  const make = () => {
    const db = {
      announcement: {
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
