import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import {
  VerificationStatus,
  VerificationApplicantType,
  UserVerificationStatus,
  Prisma,
} from '@prisma/client';
import { ListCasesDto } from './dto/list-cases.dto';
import { DecisionDto } from './dto/decision.dto';
import { UpdateThresholdsDto } from './dto/update-thresholds.dto';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { scopedCities } from '@/common/auth/city-scope';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  private async applicantScope(user: AuthStaffPayload): Promise<Prisma.VerificationCaseWhereInput> {
    const cities = scopedCities(user);
    if (cities === undefined) return {};
    const [customers, companions] = await Promise.all([
      this.prisma.customer.findMany({ where: { cityId: { in: cities } }, select: { id: true } }),
      this.prisma.companion.findMany({ where: { cityId: { in: cities } }, select: { id: true } }),
    ]);
    return {
      OR: [
        { applicantType: 'CUSTOMER', applicantId: { in: customers.map(({ id }) => id) } },
        { applicantType: 'COMPANION', applicantId: { in: companions.map(({ id }) => id) } },
      ],
    };
  }

  private async assertApplicantScope(
    kyc: { applicantType: VerificationApplicantType; applicantId: string },
    user: AuthStaffPayload,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const cities = scopedCities(user);
    if (cities === undefined) return;
    const query = { where: { id: kyc.applicantId, cityId: { in: cities } }, select: { id: true } };
    const applicant =
      kyc.applicantType === 'CUSTOMER'
        ? await db.customer.findFirst(query)
        : await db.companion.findFirst(query);
    if (!applicant) throw new NotFoundException('Verification case not found');
  }

  async listCases(dto: ListCasesDto, user: AuthStaffPayload) {
    const { page, pageSize, status, applicantType } = dto;
    const skip = (page - 1) * pageSize;

    const where: Prisma.VerificationCaseWhereInput = await this.applicantScope(user);
    if (status) where.status = status;
    if (applicantType) where.applicantType = applicantType;

    const [items, total] = await Promise.all([
      this.prisma.verificationCase.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
        include: { auditTrail: { orderBy: { timestamp: 'asc' } } },
      }),
      this.prisma.verificationCase.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
    };
  }

  async getCase(id: string, user: AuthStaffPayload) {
    const kyc = await this.prisma.verificationCase.findUnique({
      where: { id },
      include: { auditTrail: { orderBy: { timestamp: 'asc' } } },
    });
    if (!kyc) throw new NotFoundException('Verification case not found');
    await this.assertApplicantScope(kyc, user);
    return { data: kyc };
  }

  async decideCase(id: string, dto: DecisionDto, user: AuthStaffPayload) {
    const validDecisions = [
      VerificationStatus.APPROVED,
      VerificationStatus.REJECTED,
      VerificationStatus.REQUEST_RESUBMISSION,
    ];
    if (!validDecisions.includes(dto.decision)) {
      throw new BadRequestException('Invalid decision');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const kyc = await tx.verificationCase.findUnique({ where: { id } });
      if (!kyc) throw new NotFoundException('Verification case not found');
      await this.assertApplicantScope(kyc, user, tx);
      if (kyc.status !== VerificationStatus.PENDING_MANUAL_REVIEW)
        throw new ConflictException('This case is no longer pending manual review');

      // Claim the pending case before changing applicant status or recording the decision.
      const claim = await tx.verificationCase.updateMany({
        where: { id, status: VerificationStatus.PENDING_MANUAL_REVIEW },
        data: {
          status: dto.decision,
          reviewNotes: dto.reason || kyc.reviewNotes,
          reviewedByStaffId: user.sub,
          decidedAt: new Date(),
        },
      });
      if (claim.count !== 1)
        throw new ConflictException(
          'This case was decided by another reviewer. Refresh the queue.',
        );

      await tx.verificationAuditEvent.create({
        data: {
          caseId: id,
          action: `DECISION_${dto.decision}`,
          actor: user.name,
          actorId: user.sub,
          notes: dto.notes || dto.reason || null,
        },
      });

      if (
        dto.decision === VerificationStatus.APPROVED ||
        dto.decision === VerificationStatus.REJECTED
      ) {
        const updateData = {
          verificationStatus:
            dto.decision === VerificationStatus.APPROVED
              ? UserVerificationStatus.VERIFIED
              : UserVerificationStatus.REJECTED,
        };
        if (kyc.applicantType === VerificationApplicantType.CUSTOMER) {
          await tx.customer.update({ where: { id: kyc.applicantId }, data: updateData });
        } else if (kyc.applicantType === VerificationApplicantType.COMPANION) {
          await tx.companion.update({ where: { id: kyc.applicantId }, data: updateData });
        }
      }

      return tx.verificationCase.findUniqueOrThrow({ where: { id } });
    });

    return { data: result, message: `Case ${dto.decision.toLowerCase()}` };
  }

  async rerunAutoCheck(caseId: string, user: AuthStaffPayload) {
    const kyc = await this.prisma.verificationCase.findUnique({ where: { id: caseId } });
    if (!kyc) throw new NotFoundException('Verification case not found');
    await this.assertApplicantScope(kyc, user);

    // No verification provider is integrated. Stored or fabricated results are not a fresh check.
    throw new ServiceUnavailableException('Verification provider is not configured');
  }

  private async getThresholdsRaw() {
    return this.prisma.verificationThreshold.findUnique({ where: { id: 'singleton' } });
  }

  async getThresholds() {
    let t = await this.getThresholdsRaw();
    if (!t) {
      t = await this.prisma.verificationThreshold.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton' },
        update: { id: 'singleton' },
      });
    }
    return { data: t };
  }

  async updateThresholds(dto: UpdateThresholdsDto) {
    try {
      const data = await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.verificationThreshold.findUnique({
            where: { id: 'singleton' },
          });
          const approve = dto.autoApproveThreshold ?? existing?.autoApproveThreshold ?? 90;
          const reject = dto.autoRejectThreshold ?? existing?.autoRejectThreshold ?? 30;
          if (reject >= approve)
            throw new BadRequestException(
              'Auto-reject threshold must be lower than auto-approve threshold',
            );
          return tx.verificationThreshold.upsert({
            where: { id: 'singleton' },
            update: dto,
            create: { id: 'singleton', ...dto },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return { data, message: 'Thresholds updated' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2002'].includes(error.code)
      )
        throw new ConflictException('Verification settings changed. Reload before saving again.');
      throw error;
    }
  }
}
