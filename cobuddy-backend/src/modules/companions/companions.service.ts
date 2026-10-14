import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { CompanionQueryDto } from './dto/companion-query.dto';
import { UpdateCompanionStatusDto } from './dto/update-status.dto';
import { UpdateCompanionVerificationDto } from './dto/update-verification.dto';
import { UpdateTrustScoreDto } from './dto/update-trust-score.dto';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { applyCityScope } from '@/common/guards/city-scope.guard';
import { Prisma } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { COMPANION_PUBLIC_SELECT, BANK_ACCOUNT_PUBLIC_SELECT } from '@/common/public-selects';

@Injectable()
export class CompanionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: CompanionQueryDto, req: any) {
    let where: Prisma.CompanionWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.verificationStatus) where.verificationStatus = q.verificationStatus;
    if (q.cityId) where.cityId = q.cityId;
    if (q.minTrustScore) where.trustScore = { gte: q.minTrustScore };
    if (q.minEarnings) where.totalEarnings = { gte: q.minEarnings };
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
        { email: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    where = applyCityScope(where, req);

    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.companion.count({ where }),
      this.prisma.companion.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          ...COMPANION_PUBLIC_SELECT,
          city: { select: { id: true, name: true } },
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data: list,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrevious: q.page > 1,
      },
    };
  }

  async findOne(id: string) {
    const companion = await this.prisma.companion.findUnique({
      where: { id },
      select: {
        ...COMPANION_PUBLIC_SELECT,
        city: { select: { id: true, name: true } },
        wallet: true,
        bankAccounts: { select: BANK_ACCOUNT_PUBLIC_SELECT },
      },
    });
    if (!companion) throw new NotFoundException('Companion not found');
    return { data: companion };
  }

  async updateStatus(id: string, dto: UpdateCompanionStatusDto) {
    const companion = await this.prisma.companion.findUnique({ where: { id } });
    if (!companion) throw new NotFoundException('Companion not found');
    const updated = await this.prisma.companion.update({
      where: { id },
      data: { status: dto.status },
      select: COMPANION_PUBLIC_SELECT,
    });
    return { data: updated, message: `Companion status updated to ${dto.status}` };
  }

  async updateVerificationStatus(id: string, dto: UpdateCompanionVerificationDto) {
    const companion = await this.prisma.companion.findUnique({ where: { id } });
    if (!companion) throw new NotFoundException('Companion not found');
    const updated = await this.prisma.companion.update({
      where: { id },
      data: { verificationStatus: dto.verificationStatus },
      select: COMPANION_PUBLIC_SELECT,
    });
    return { data: updated, message: `Verification status updated to ${dto.verificationStatus}` };
  }

  async updateTrustScore(id: string, dto: UpdateTrustScoreDto, _admin: AuthStaffPayload) {
    const companion = await this.prisma.companion.findUnique({ where: { id } });
    if (!companion) throw new NotFoundException('Companion not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const historyEntry = await tx.trustScoreHistoryEntry.create({
        data: {
          companionId: id,
          oldScore: companion.trustScore,
          newScore: dto.newScore,
          reason: dto.reason,
          reasonCategory: 'admin_override',
        },
      });
      const updatedCompanion = await tx.companion.update({
        where: { id },
        data: { trustScore: dto.newScore },
        select: COMPANION_PUBLIC_SELECT,
      });
      return { companion: updatedCompanion, historyEntry };
    });

    return {
      data: result,
      message: `Trust score updated from ${companion.trustScore} to ${dto.newScore}`,
    };
  }

  async getPayouts(id: string, q: PaginationQueryDto) {
    const companion = await this.prisma.companion.findUnique({ where: { id } });
    if (!companion) throw new NotFoundException('Companion not found');

    const where = { companionId: id };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.payout.count({ where }),
      this.prisma.payout.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          bankAccount: {
            select: { id: true, accountName: true, accountLast4: true, ifscCode: true },
          },
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data: list,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrevious: q.page > 1,
      },
    };
  }

  async getReviews(id: string, q: PaginationQueryDto) {
    const companion = await this.prisma.companion.findUnique({ where: { id } });
    if (!companion) throw new NotFoundException('Companion not found');

    const where = { toCompanionId: id };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          byCustomer: { select: { id: true, name: true, profilePicUrl: true } },
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data: list,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        totalItems,
        totalPages,
        hasNext: q.page < totalPages,
        hasPrevious: q.page > 1,
      },
    };
  }

  async getBankAccounts(id: string) {
    const companion = await this.prisma.companion.findUnique({ where: { id } });
    if (!companion) throw new NotFoundException('Companion not found');

    const list = await this.prisma.bankAccount.findMany({
      where: { companionId: id },
      select: BANK_ACCOUNT_PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return { data: list };
  }

  async approveBankAccount(companionId: string, bankId: string) {
    const companion = await this.prisma.companion.findUnique({ where: { id: companionId } });
    if (!companion) throw new NotFoundException('Companion not found');

    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: bankId, companionId },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const updated = await this.prisma.bankAccount.update({
      where: { id: bankId },
      data: { verified: true },
      select: BANK_ACCOUNT_PUBLIC_SELECT,
    });
    return { data: updated, message: 'Bank account approved' };
  }
}
