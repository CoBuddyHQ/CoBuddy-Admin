import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  UserVerificationStatus,
  VerificationApplicantType,
  VerificationStatus,
} from '@prisma/client';
import { VerificationService } from './verification.service';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { DecisionDto } from './dto/decision.dto';

describe('Verification provider safety', () => {
  it.each([
    { faceMatchScore: null, livenessPass: null, documentValid: null },
    { faceMatchScore: 99, livenessPass: true, documentValid: true },
  ])('never fabricates or reuses results as a fresh provider check', async (evidence) => {
    const db: any = {
      verificationCase: { findUnique: jest.fn().mockResolvedValue({ id: 'case-1', ...evidence }) },
      $transaction: jest.fn(),
    };
    const service = new VerificationService(db);
    await expect(service.rerunAutoCheck('case-1', { sub: 'admin-1' } as any)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('reports nonexistent verification cases without writing data', async () => {
    const db: any = {
      verificationCase: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    };
    await expect(
      new VerificationService(db).rerunAutoCheck('missing', { sub: 'admin-1' } as any),
    ).rejects.toThrow(NotFoundException);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe('Verification manual decision integrity', () => {
  const user = { sub: 'reviewer-1', name: 'Reviewer' } as AuthStaffPayload;

  function setup(
    status: VerificationStatus = VerificationStatus.PENDING_MANUAL_REVIEW,
    applicantType: VerificationApplicantType = VerificationApplicantType.CUSTOMER,
  ) {
    const row = {
      id: 'case-1',
      applicantId: 'applicant-1',
      applicantType,
      status,
      reviewNotes: null,
    };
    const tx = {
      verificationCase: {
        findUnique: jest.fn().mockResolvedValue(row),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ ...row, status: VerificationStatus.APPROVED }),
      },
      verificationAuditEvent: { create: jest.fn().mockResolvedValue({}) },
      customer: { update: jest.fn().mockResolvedValue({}) },
      companion: { update: jest.fn().mockResolvedValue({}) },
    };
    const db: any = { $transaction: jest.fn(async (work) => work(tx)) };
    return { db, tx, service: new VerificationService(db) };
  }

  it.each([
    VerificationStatus.APPROVED,
    VerificationStatus.REJECTED,
    VerificationStatus.AUTO_APPROVED,
    VerificationStatus.AUTO_REJECTED,
    VerificationStatus.REQUEST_RESUBMISSION,
  ])('refuses a new decision when the case is %s', async (status) => {
    const { service, tx } = setup(status);
    await expect(service.decideCase('case-1', { decision: 'APPROVED' }, user)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.verificationCase.updateMany).not.toHaveBeenCalled();
    expect(tx.verificationAuditEvent.create).not.toHaveBeenCalled();
    expect(tx.customer.update).not.toHaveBeenCalled();
    expect(tx.companion.update).not.toHaveBeenCalled();
  });

  it('does not write an audit event or applicant status after losing a concurrent claim', async () => {
    const { service, tx } = setup();
    tx.verificationCase.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.decideCase('case-1', { decision: 'REJECTED' }, user)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.verificationCase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'case-1', status: VerificationStatus.PENDING_MANUAL_REVIEW },
      }),
    );
    expect(tx.verificationAuditEvent.create).not.toHaveBeenCalled();
    expect(tx.customer.update).not.toHaveBeenCalled();
    expect(tx.companion.update).not.toHaveBeenCalled();
  });

  it.each([
    [
      VerificationApplicantType.CUSTOMER,
      VerificationStatus.APPROVED,
      UserVerificationStatus.VERIFIED,
    ],
    [
      VerificationApplicantType.CUSTOMER,
      VerificationStatus.REJECTED,
      UserVerificationStatus.REJECTED,
    ],
    [
      VerificationApplicantType.COMPANION,
      VerificationStatus.APPROVED,
      UserVerificationStatus.VERIFIED,
    ],
    [
      VerificationApplicantType.COMPANION,
      VerificationStatus.REJECTED,
      UserVerificationStatus.REJECTED,
    ],
  ] as const)(
    'updates %s status for %s inside the decision transaction',
    async (applicantType, decision, expectedStatus) => {
      const { service, tx } = setup(VerificationStatus.PENDING_MANUAL_REVIEW, applicantType);
      await service.decideCase('case-1', { decision, notes: 'Evidence reviewed' }, user);
      const target =
        applicantType === VerificationApplicantType.CUSTOMER ? tx.customer : tx.companion;
      const other =
        applicantType === VerificationApplicantType.CUSTOMER ? tx.companion : tx.customer;
      expect(target.update).toHaveBeenCalledWith({
        where: { id: 'applicant-1' },
        data: { verificationStatus: expectedStatus },
      });
      expect(other.update).not.toHaveBeenCalled();
      expect(tx.verificationAuditEvent.create).toHaveBeenCalledWith({
        data: {
          caseId: 'case-1',
          action: `DECISION_${decision}`,
          actor: user.name,
          actorId: user.sub,
          notes: 'Evidence reviewed',
        },
      });
    },
  );

  it('records a resubmission request without claiming the applicant passed or failed', async () => {
    const { service, tx } = setup();
    await service.decideCase(
      'case-1',
      { decision: 'REQUEST_RESUBMISSION', reason: 'Document unreadable' },
      user,
    );
    expect(tx.verificationCase.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'REQUEST_RESUBMISSION',
          reviewNotes: 'Document unreadable',
        }),
      }),
    );
    expect(tx.customer.update).not.toHaveBeenCalled();
    expect(tx.companion.update).not.toHaveBeenCalled();
    expect(tx.verificationAuditEvent.create).toHaveBeenCalledTimes(1);
  });

  it('refuses missing cases without changing applicant data', async () => {
    const { service, tx } = setup();
    tx.verificationCase.findUnique.mockResolvedValue(null);
    await expect(service.decideCase('missing', { decision: 'APPROVED' }, user)).rejects.toThrow(
      NotFoundException,
    );
    expect(tx.verificationCase.updateMany).not.toHaveBeenCalled();
  });

  it('rejects non-manual decisions before starting a transaction', async () => {
    const { service, db } = setup();
    await expect(
      service.decideCase('case-1', { decision: 'AUTO_APPROVED' } as unknown as DecisionDto, user),
    ).rejects.toThrow(BadRequestException);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
