import { InternalSyncService } from './internal-sync.service';

describe('authoritative booking synchronization', () => {
  it('does not reopen a completed booking after an old start event', async () => {
    const prisma = { booking: { findUnique: jest.fn().mockResolvedValue({ id: 'booking', status: 'COMPLETED' }), update: jest.fn() } };
    await expect(new InternalSyncService(prisma as any).syncBooking({ bookingId: 'booking', status: 'active' })).resolves.toMatchObject({ ignored: true, status: 'COMPLETED' });
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
  it('does not fabricate identities, city or payment state for an incomplete new booking', async () => {
    const prisma = { booking: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() } };
    await expect(new InternalSyncService(prisma as any).syncBooking({ bookingId: 'new', status: 'pending' })).rejects.toThrow('mapping is required');
    expect(prisma.booking.upsert).not.toHaveBeenCalled();
  });
  it('rejects unknown source states instead of mapping them to pending', async () => {
    await expect(new InternalSyncService({} as any).syncBooking({ bookingId: 'booking', status: 'unknown' })).rejects.toThrow('Unsupported source booking status');
  });
});

describe('authoritative review synchronization', () => {
  it('stores a real companion-authored review without inventing a customer record', async () => {
    const prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'customer-1' }), create: jest.fn() },
      companion: { findUnique: jest.fn().mockResolvedValue({ id: 'companion-1' }), create: jest.fn() },
      review: { upsert: jest.fn().mockResolvedValue({ id: 'review-1' }) },
      city: { create: jest.fn(), findFirst: jest.fn() },
    };
    const service = new InternalSyncService(prisma as any);

    await expect(service.syncReview({
      bookingId: 'booking-1',
      byCompanionId: 'companion-1',
      toCustomerId: 'customer-1',
      rating: 4,
    })).resolves.toMatchObject({ success: true, reviewId: 'review-1' });

    expect(prisma.review.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        bookingId_byCompanionId_toCustomerId: {
          bookingId: 'booking-1',
          byCompanionId: 'companion-1',
          toCustomerId: 'customer-1',
        },
      },
      create: expect.objectContaining({
        byCustomerId: undefined,
        byCompanionId: 'companion-1',
        toCustomerId: 'customer-1',
      }),
    }));
    expect(prisma.customer.create).not.toHaveBeenCalled();
    expect(prisma.companion.create).not.toHaveBeenCalled();
    expect(prisma.city.create).not.toHaveBeenCalled();
  });

  it('leaves a review pending for retry when a referenced identity has not synced', async () => {
    const prisma = {
      customer: { findUnique: jest.fn().mockResolvedValue(null) },
      companion: { findUnique: jest.fn().mockResolvedValue({ id: 'companion-1' }) },
      review: { upsert: jest.fn() },
      city: { create: jest.fn(), findFirst: jest.fn() },
    };
    const service = new InternalSyncService(prisma as any);

    await expect(service.syncReview({
      bookingId: 'booking-1',
      byCustomerId: 'customer-1',
      toCompanionId: 'companion-1',
      rating: 5,
    })).rejects.toThrow('not synchronized to Admin yet');
    expect(prisma.review.upsert).not.toHaveBeenCalled();
    expect(prisma.city.create).not.toHaveBeenCalled();
  });

  it('rejects reviews without a single explicit author and recipient', async () => {
    const service = new InternalSyncService({} as any);
    await expect(service.syncReview({ bookingId: 'booking-1', rating: 5 }))
      .rejects.toThrow('exactly one author');
  });
});
