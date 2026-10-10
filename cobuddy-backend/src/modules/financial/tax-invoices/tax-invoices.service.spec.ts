import { BadRequestException, ConflictException } from '@nestjs/common';
import { TaxInvoicesService } from './tax-invoices.service';

describe('Invoice transitions', () => {
  function fixture(initial = 'ISSUED') {
    let status = initial;
    const db: any = {
      taxInvoice: {
        findUnique: jest.fn(async () => ({ id: 'i', status })),
        updateMany: jest.fn(async ({ where, data }) => {
          if (status !== where.status) return { count: 0 };
          status = data.status;
          return { count: 1 };
        }),
        findUniqueOrThrow: jest.fn(async () => ({ id: 'i', status })),
      },
    };
    db.$transaction = (work: any) => work(db);
    return { service: new TaxInvoicesService(db), db, status: () => status };
  }

  it('rejects one of concurrent paid and cancel operations', async () => {
    const { service } = fixture();
    const results = await Promise.allSettled([
      service.markPaid('i', {} as any),
      service.cancel('i', {} as any),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({
      reason: expect.any(ConflictException),
    });
  });

  it.each(['PAID', 'CANCELLED'])('keeps %s invoices terminal', async (status) => {
    const { service, db } = fixture(status);
    await expect(service.cancel('i', {} as any)).rejects.toThrow(BadRequestException);
    await expect(service.markPaid('i', {} as any)).rejects.toThrow(BadRequestException);
    expect(db.taxInvoice.updateMany).not.toHaveBeenCalled();
  });

  it('requires issue before marking paid', async () => {
    const { service, status } = fixture('DRAFT');
    await expect(service.markPaid('i', {} as any)).rejects.toThrow(BadRequestException);
    await service.issue('i', {} as any);
    await service.markPaid('i', {} as any);
    expect(status()).toBe('PAID');
  });
});
