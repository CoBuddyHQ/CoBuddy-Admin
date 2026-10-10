import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OperationsApiService } from './operations-api.service';
import { OverrideDisputeRefundDto, UpdateDisputeStatusDto } from './dto/dispute.dto';

describe('Dispute authorization and refund workflow', () => {
  const user = {
    sub: 'support-1',
    roles: ['SUPPORT_AGENT', 'CITY_OPS_MANAGER'],
    cityScopeIds: ['city-a'],
  } as any;
  function fixture(overrides = {}) {
    const record = {
      id: 'dispute-1',
      bookingId: 'booking-1',
      workflowStatus: 'OPEN',
      version: 2,
      refundAmount: new Prisma.Decimal('25.01'),
      overridePercent: 25,
      overrideReason: 'Reviewed evidence',
      description: 'Dispute',
      booking: { bookingAmount: new Prisma.Decimal('100.03') },
      ...overrides,
    };
    const tx = {
      bookingDispute: {
        findFirst: jest.fn().mockResolvedValue(record),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue(record),
      },
      refund: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'refund-1' }),
      },
    };
    const prisma = { $transaction: jest.fn((fn) => fn(tx)) };
    return { service: new OperationsApiService(prisma as any), tx };
  }

  it('scopes both reads and writes to the staff city even with multiple roles', async () => {
    const { service, tx } = fixture();
    await service.updateDisputeStatus('dispute-1', { status: 'ESCALATED', version: 2 }, user);
    const where = { id: 'dispute-1', booking: { cityId: { in: ['city-a'] } } };
    expect(tx.bookingDispute.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(tx.bookingDispute.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ...where, version: 2 },
        data: expect.objectContaining({ workflowStatus: 'ESCALATED' }),
      }),
    );
  });

  it('denies out-of-scope disputes without creating a refund or writing', async () => {
    const { service, tx } = fixture();
    tx.bookingDispute.findFirst.mockResolvedValue(null);
    await expect(
      service.updateDisputeStatus('hidden', { status: 'REFUND_PENDING', version: 2 }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.overrideDisputePenalty('hidden', { percent: 50, reason: 'Review', version: 2 }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.refund.create).not.toHaveBeenCalled();
    expect(tx.bookingDispute.updateMany).not.toHaveBeenCalled();
  });

  it.each(['REFUND_PENDING', 'RESOLVED_REFUND', 'RESOLVED_NO_REFUND', 'REFUND_REVIEW_REQUIRED'])(
    'does not reopen %s',
    async (workflowStatus) => {
      const { service, tx } = fixture({ workflowStatus });
      await expect(
        service.overrideDisputePenalty(
          'dispute-1',
          { percent: 50, reason: 'Review', version: 2 },
          user,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.bookingDispute.updateMany).not.toHaveBeenCalled();
    },
  );

  it('creates a finance request without claiming the customer was credited', async () => {
    const { service, tx } = fixture();
    await service.updateDisputeStatus('dispute-1', { status: 'REFUND_PENDING', version: 2 }, user);
    expect(tx.refund.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestedById: 'support-1',
        amount: new Prisma.Decimal('25.01'),
      }),
    });
    const data = tx.bookingDispute.updateMany.mock.calls[0][0].data;
    expect(data.workflowStatus).toBe('REFUND_PENDING');
    expect(data.refundId).toBe('refund-1');
    expect(data.resolvedAt).toBeUndefined();
  });

  it('rejects a stale version and a competing update', async () => {
    const { service, tx } = fixture();
    await expect(
      service.updateDisputeStatus('dispute-1', { status: 'ESCALATED', version: 1 }, user),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.bookingDispute.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.updateDisputeStatus('dispute-1', { status: 'ESCALATED', version: 2 }, user),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires a reviewed positive amount and refuses a second booking refund', async () => {
    const unset = fixture({ overridePercent: null });
    await expect(
      unset.service.updateDisputeStatus(
        'dispute-1',
        { status: 'REFUND_PENDING', version: 2 },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    const { service, tx } = fixture();
    tx.refund.findFirst.mockResolvedValue({ id: 'existing-refund' });
    await expect(
      service.updateDisputeStatus('dispute-1', { status: 'REFUND_PENDING', version: 2 }, user),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.refund.create).not.toHaveBeenCalled();
  });

  it('stores exact rounded currency and structured override details without losing escalation', async () => {
    const { service, tx } = fixture({ workflowStatus: 'ESCALATED' });
    await service.overrideDisputePenalty(
      'dispute-1',
      { percent: 25, reason: ' Evidence reviewed ', version: 2 },
      user,
    );
    const data = tx.bookingDispute.updateMany.mock.calls[0][0].data;
    expect(data.refundAmount.toFixed(2)).toBe('25.01');
    expect(data.overrideReason).toBe('Evidence reviewed');
    expect(data.workflowStatus).toBeUndefined();
  });

  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });
  it.each([
    { reason: 42 },
    { reason: null },
    { reason: ' ' },
    { percent: '25' },
    { percent: -1 },
    { percent: 101 },
    { percent: 25.001 },
  ])('returns a validation error for malformed overrides %j', async (invalid) => {
    await expect(
      pipe.transform(
        { percent: 25, reason: 'Reviewed', version: 2, ...invalid },
        { type: 'body', metatype: OverrideDisputeRefundDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    { status: 'RESOLVED_REFUND' },
    { status: 'OPEN' },
    { note: 42 },
    { note: null },
    { version: -1 },
    { extra: true },
  ])('rejects invalid status requests %j', async (invalid) => {
    await expect(
      pipe.transform(
        { status: 'ESCALATED', version: 2, ...invalid },
        { type: 'body', metatype: UpdateDisputeStatusDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
