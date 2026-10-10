import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { VerificationService } from './verification.service';

describe('Verification settings consistency', () => {
  function setup(
    existing: { autoApproveThreshold: number; autoRejectThreshold: number } | null = {
      autoApproveThreshold: 90,
      autoRejectThreshold: 30,
    },
  ) {
    const tx = {
      verificationThreshold: {
        findUnique: jest.fn().mockResolvedValue(existing),
        upsert: jest.fn().mockResolvedValue({ ...existing, id: 'singleton' }),
      },
    };
    const db: any = {
      $transaction: jest.fn(async (work) => work(tx)),
      verificationThreshold: tx.verificationThreshold,
    };
    return { tx, db, service: new VerificationService(db) };
  }

  it.each([
    { autoApproveThreshold: 30 },
    { autoRejectThreshold: 90 },
    { autoApproveThreshold: 50, autoRejectThreshold: 50 },
    { autoApproveThreshold: 30, autoRejectThreshold: 70 },
  ])('rejects overlapping thresholds against the stored values %#', async (dto) => {
    const { service, tx } = setup();
    await expect(service.updateThresholds(dto)).rejects.toThrow(BadRequestException);
    expect(tx.verificationThreshold.upsert).not.toHaveBeenCalled();
  });

  it('checks the schema defaults when settings have not been initialized', async () => {
    const { service, tx } = setup(null);
    await expect(service.updateThresholds({ autoRejectThreshold: 95 })).rejects.toThrow(
      BadRequestException,
    );
    expect(tx.verificationThreshold.upsert).not.toHaveBeenCalled();
  });

  it('isolates partial updates so concurrent changes cannot cross the thresholds', async () => {
    const { service, db, tx } = setup();
    await service.updateThresholds({ autoRejectThreshold: 40, livenessRequired: false });
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.verificationThreshold.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      update: { autoRejectThreshold: 40, livenessRequired: false },
      create: { id: 'singleton', autoRejectThreshold: 40, livenessRequired: false },
    });
  });

  it.each(['P2034', 'P2002'])(
    'maps transaction/initialization conflict %s to a reloadable conflict',
    async (code) => {
      const { service, db } = setup();
      db.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('fixture', { code, clientVersion: 'test' }),
      );
      await expect(service.updateThresholds({ autoRejectThreshold: 40 })).rejects.toThrow(
        ConflictException,
      );
    },
  );

  it('initializes the singleton with an upsert instead of a read/create race', async () => {
    const { service, tx } = setup(null);
    await service.getThresholds();
    expect(tx.verificationThreshold.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: { id: 'singleton' },
    });
  });
});
