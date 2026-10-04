import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '@/prisma/prisma.module';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

describe('Payout input validation', () => {
  let app: INestApplication;
  const service = { hold: jest.fn(), markFailed: jest.fn(), markPaid: jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PayoutsController],
      providers: [
        { provide: PayoutsService, useValue: service },
        { provide: PrismaService, useValue: { auditLog: { create: jest.fn() } } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
  });

  it.each([
    ['hold', {}],
    ['hold', { reason: '   ' }],
    ['hold', { reason: 'x'.repeat(501) }],
    ['mark-failed', {}],
    ['mark-failed', { reason: '' }],
    ['mark-failed', { reason: 'Valid reason', status: 'PAID' }],
    ['mark-paid', {}],
    ['mark-paid', { utrNumber: '  ' }],
    ['mark-paid', { utrNumber: 'x'.repeat(129) }],
  ])('rejects invalid %s payloads', async (action, body) => {
    await request(app.getHttpServer())
      .post('/financial/payouts/payout-1/' + action)
      .send(body)
      .expect(400);
    expect(service.hold).not.toHaveBeenCalled();
    expect(service.markFailed).not.toHaveBeenCalled();
    expect(service.markPaid).not.toHaveBeenCalled();
  });

  it('trims the required failure reason before passing it to the service', async () => {
    await request(app.getHttpServer())
      .post('/financial/payouts/payout-1/mark-failed')
      .send({ reason: '  Bank rejected transfer  ' })
      .expect(201);
    expect(service.markFailed).toHaveBeenCalledWith(
      'payout-1',
      'Bank rejected transfer',
      undefined,
    );
  });
});
