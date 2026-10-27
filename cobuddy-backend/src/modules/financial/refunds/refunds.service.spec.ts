import { RefundStatus } from '@prisma/client';
import { ServiceUnavailableException } from '@nestjs/common';
import { RefundsService } from './refunds.service';

describe('Refund processing ledger safety', () => {
  const dbForApprovedRefund = () => {
    const db: any = {
      refund: {
        findUnique: jest.fn().mockResolvedValue({ id: 'refund-1', status: RefundStatus.APPROVED }),
      },
      $transaction: jest.fn(),
    };
    return { service: new RefundsService(db), db };
  };

  it('keeps an approved refund unchanged when no payment-provider settlement is available', async () => {
    const { service, db } = dbForApprovedRefund();
    await expect(
      service.process('refund-1', { sub: 'admin-1', name: 'Admin' } as any),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
