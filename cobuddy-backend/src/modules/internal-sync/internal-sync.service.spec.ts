import { InternalSyncService } from './internal-sync.service';

describe('authoritative booking synchronization', () => {
  it('does not reopen a completed booking after an old start event', async () => {
    const prisma = { booking: { findUnique: jest.fn().mockResolvedValue({ id: 'booking', status: 'COMPLETED' }), update: jest.fn() } };
    await expect(new InternalSyncService(prisma as any).syncBooking({ bookingId: 'booking', status: 'active' })).resolves.toMatchObject({ ignored: true, status: 'COMPLETED' });
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
  it('does not fabricate identities, city or payment state for an incomplete new booking', async () => {
    const prisma = {
      booking: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() },
      city: { create: jest.fn() },
      customer: { create: jest.fn() },
      companion: { create: jest.fn() },
    };
    await expect(new InternalSyncService(prisma as any).syncBooking({ bookingId: 'new', status: 'pending' })).rejects.toThrow('mapping is required');
    expect(prisma.booking.upsert).not.toHaveBeenCalled();
    expect(prisma.city.create).not.toHaveBeenCalled();
    expect(prisma.customer.create).not.toHaveBeenCalled();
    expect(prisma.companion.create).not.toHaveBeenCalled();
  });

  it('does not manufacture payment, reconciliation, escrow, or payout records from a booking status sync', async () => {
    const booking = { id: 'booking-1', status: 'PENDING', escrowReleaseAt: null };
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(booking),
        update: jest.fn(),
      },
      city: { findUnique: jest.fn().mockResolvedValue({ id: 'city-1', cityCode: 'BLR', name: { en: 'Bengaluru' }, active: true }) },
      customer: { findUnique: jest.fn().mockResolvedValue({ id: 'customer-1', name: 'Customer One' }) },
      companion: { findUnique: jest.fn().mockResolvedValue({ id: 'companion-1', name: 'Companion One' }) },
      sessionAuditLog: { create: jest.fn().mockResolvedValue({}) },
      wallet: { upsert: jest.fn() },
      walletTransaction: { create: jest.fn() },
      reconciliationRecord: { create: jest.fn() },
      payout: { create: jest.fn() },
    };
    const service = new InternalSyncService(prisma as any);

    await expect(service.syncBooking({
      bookingId: 'booking-1',
      customerId: 'customer-1',
      companionId: 'companion-1',
      cityId: 'city-1',
      activityName: 'Coffee Meetup',
      venueName: 'Cafe One',
      startTime: '2026-11-01T10:00:00.000Z',
      endTime: '2026-11-01T12:00:00.000Z',
      durationMins: 120,
      status: 'pending',
      bookingAmount: 100,
      platformFeeAmount: 20,
      companionNetAmount: 80,
      paymentStatus: 'pending',
    })).resolves.toMatchObject({ success: true, bookingId: 'booking-1' });

    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(prisma.wallet.upsert).not.toHaveBeenCalled();
    expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
    expect(prisma.reconciliationRecord.create).not.toHaveBeenCalled();
    expect(prisma.payout.create).not.toHaveBeenCalled();
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

describe('authoritative onboarding synchronization', () => {
  it('refuses a KYC case without persisted document and selfie URLs', async () => {
    const prisma = {
      city: { findMany: jest.fn(), create: jest.fn() },
      companion: { findUnique: jest.fn(), create: jest.fn() },
      customer: { findUnique: jest.fn(), create: jest.fn() },
      verificationCase: { upsert: jest.fn() },
    };
    const service = new InternalSyncService(prisma as any);

    await expect(service.syncVerificationCase({
      applicantId: 'companion-1',
      applicantType: 'COMPANION',
      documentType: 'AADHAAR',
    })).rejects.toThrow('Real document type, document URL, and selfie URL are required.');

    expect(prisma.city.findMany).not.toHaveBeenCalled();
    expect(prisma.companion.create).not.toHaveBeenCalled();
    expect(prisma.verificationCase.upsert).not.toHaveBeenCalled();
  });

  it('does not assign an application to a default or unrelated city', async () => {
    const prisma = {
      city: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
      companion: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
      companionApplication: { upsert: jest.fn() },
    };
    const service = new InternalSyncService(prisma as any);

    await expect(service.syncCompanionApplication({
      companionId: 'companion-1',
      firstName: 'Test',
      lastName: 'Companion',
      phone: '+910000000001',
      cityName: 'Missing City',
    })).rejects.toThrow('No active Admin city matches the supplied city.');

    expect(prisma.city.create).not.toHaveBeenCalled();
    expect(prisma.companion.create).not.toHaveBeenCalled();
    expect(prisma.companionApplication.upsert).not.toHaveBeenCalled();
  });
});

describe('authoritative report synchronization', () => {
  it('rejects placeholder target IDs and implicit user types', async () => {
    const service = new InternalSyncService({} as any);

    await expect(service.syncUserReport({
      reporterId: 'customer-1',
      reporterType: 'CUSTOMER',
      reportedUserId: 'unknown_companion',
      reportedUserType: 'COMPANION',
      categoryCode: 'SAFETY',
      description: 'Test report',
    } as any)).rejects.toThrow('real user IDs and explicit reporter and reported-user types');
    await expect(service.syncUserReport({
      reporterId: 'customer-1',
      reportedUserId: 'companion-1',
      categoryCode: 'SAFETY',
      description: 'Test report',
    } as any)).rejects.toThrow('real user IDs and explicit reporter and reported-user types');
  });
});
