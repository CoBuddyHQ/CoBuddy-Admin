import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { VerificationCasesController } from './verification-cases.controller';
import { ThresholdsController } from './thresholds.controller';
import { VerificationService } from './verification.service';
import { Request, Response, NextFunction } from 'express';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

describe('Verification request contracts', () => {
  let app: INestApplication;
  const service = { decideCase: jest.fn(), updateThresholds: jest.fn() };
  const user: AuthStaffPayload = {
    sub: 'reviewer',
    employeeId: 'REVIEWER',
    email: 'reviewer@example.invalid',
    name: 'Reviewer',
    roles: ['MODERATOR'],
    cityScopeIds: [],
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [VerificationCasesController, ThresholdsController],
      providers: [{ provide: VerificationService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    // This contract test omits the real JWT guard; provide its authenticated payload.
    app.use((req: Request & { user?: AuthStaffPayload }, _res: Response, next: NextFunction) => {
      req.user = user;
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
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
    {},
    { decision: 'AUTO_APPROVED' },
    { decision: 'PENDING_MANUAL_REVIEW' },
    { decision: 'REJECTED' },
    { decision: 'REQUEST_RESUBMISSION' },
    { decision: 'REJECTED', reason: '  ' },
    { decision: 'REJECTED', reason: null },
    { decision: 'REJECTED', reason: 1234 },
    { decision: 'REJECTED', reason: 'x'.repeat(501) },
    { decision: 'APPROVED', notes: null },
    { decision: 'APPROVED', notes: false },
    { decision: 'APPROVED', notes: 'x'.repeat(1001) },
    { decision: 'APPROVED', reviewedByStaffId: 'other' },
  ])('rejects unsafe/manual-decision payload %#', async (body) => {
    await request(app.getHttpServer())
      .post('/verification/cases/case-1/decision')
      .send(body)
      .expect(400);
    expect(service.decideCase).not.toHaveBeenCalled();
  });

  it('trims a rejection reason and review notes', async () => {
    await request(app.getHttpServer())
      .post('/verification/cases/case-1/decision')
      .send({ decision: 'REJECTED', reason: '  Document expired  ', notes: '  Reviewed  ' })
      .expect(201);
    expect(service.decideCase).toHaveBeenCalledWith(
      'case-1',
      expect.objectContaining({
        decision: 'REJECTED',
        reason: 'Document expired',
        notes: 'Reviewed',
      }),
      user,
    );
  });

  it('allows manual approval without an optional note', async () => {
    await request(app.getHttpServer())
      .post('/verification/cases/case-1/decision')
      .send({ decision: 'APPROVED' })
      .expect(201);
    expect(service.decideCase).toHaveBeenCalledTimes(1);
  });

  it.each([
    { autoApproveThreshold: null },
    { autoApproveThreshold: '90' },
    { autoApproveThreshold: 101 },
    { autoRejectThreshold: -1 },
    { autoRejectThreshold: 30.5 },
    { autoRejectThreshold: null },
    { livenessRequired: 'false' },
    { livenessRequired: 0 },
    { livenessRequired: null },
    { enabledProvider: 'OTHER' },
    { enabledProvider: null },
    { id: 'singleton' },
  ])('rejects invalid settings payload %#', async (body) => {
    await request(app.getHttpServer()).put('/verification/thresholds').send(body).expect(400);
    expect(service.updateThresholds).not.toHaveBeenCalled();
  });

  it('preserves a boolean false in a partial settings update', async () => {
    await request(app.getHttpServer())
      .put('/verification/thresholds')
      .send({ livenessRequired: false })
      .expect(200);
    expect(service.updateThresholds).toHaveBeenCalledWith(
      expect.objectContaining({ livenessRequired: false }),
    );
  });
});
