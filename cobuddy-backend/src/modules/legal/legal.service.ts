import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { cityWhere, requireGlobal, scopedCities } from '@/common/auth/city-scope';
import { LegalInput } from '@/common/validation/workflow-inputs';

const identitySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  cityId: true,
  joinDate: true,
  status: true,
  verificationStatus: true,
} as const;

@Injectable()
export class LegalService {
  constructor(private readonly db: PrismaService) {}
  private async names(ids: string[]) {
    const [customers, companions] = await Promise.all([
      this.db.customer.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      this.db.companion.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    ]);
    return new Map<string, string>([
      ...customers.map((c) => [`CUSTOMER:${c.id}`, c.name] as const),
      ...companions.map((c) => [`COMPANION:${c.id}`, c.name] as const),
    ]);
  }
  private async account(id: string, type: string, user: AuthStaffPayload) {
    const where = { id, ...cityWhere(user) };
    const account =
      type === 'CUSTOMER'
        ? await this.db.customer.findFirst({ where, select: identitySelect })
        : await this.db.companion.findFirst({ where, select: identitySelect });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
  private async scope(user: AuthStaffPayload) {
    if (!scopedCities(user)) return {};
    const [customers, companions] = await Promise.all([
      this.db.customer.findMany({ where: cityWhere(user), select: { id: true } }),
      this.db.companion.findMany({ where: cityWhere(user), select: { id: true } }),
    ]);
    return {
      OR: [
        { userType: 'CUSTOMER', userId: { in: customers.map((c) => c.id) } },
        { userType: 'COMPANION', userId: { in: companions.map((c) => c.id) } },
      ],
    };
  }
  async privacy(user: AuthStaffPayload) {
    const requests = await this.db.dataPrivacyRequest.findMany({
      where: await this.scope(user),
      select: {
        id: true,
        userId: true,
        userType: true,
        requestType: true,
        status: true,
        legalHold: true,
        createdAt: true,
        fulfillmentUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const holds = await this.db.legalRequest.findMany({
      where: { preserveUntil: { gt: new Date() } },
      select: { targetUserId: true, targetUserType: true },
    });
    const names = await this.names(requests.map((r) => r.userId));
    return requests.map((r) => ({
      ...r,
      userName: names.get(`${r.userType}:${r.userId}`) ?? r.userId,
      legalHold:
        r.legalHold ||
        holds.some((h) => h.targetUserId === r.userId && h.targetUserType === r.userType),
      requestDate: r.createdAt,
      dueDate: new Date(r.createdAt.getTime() + 30 * 86400000),
    }));
  }
  async createPrivacy(
    input: { userId: string; userType: string; requestType: string },
    user: AuthStaffPayload,
  ) {
    await this.account(input.userId, input.userType, user);
    return this.db.dataPrivacyRequest.create({
      data: { ...input, requestRef: `PRV-${randomUUID()}`, status: 'PENDING', requestedFields: [] },
    });
  }
  async hold(id: string, legalHold: boolean, user: AuthStaffPayload) {
    const request = await this.db.dataPrivacyRequest.findFirst({
      where: { id, ...(await this.scope(user)) },
    });
    if (!request) throw new NotFoundException('Privacy request not found');
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${request.userId}))`;
      if (
        !legalHold &&
        (await tx.legalRequest.count({
          where: {
            targetUserId: request.userId,
            targetUserType: request.userType,
            preserveUntil: { gt: new Date() },
          },
        }))
      )
        throw new ConflictException(
          'An active legal preservation request prevents releasing this hold',
        );
      return tx.dataPrivacyRequest.update({
        where: { id },
        data: { legalHold },
        select: { id: true, legalHold: true },
      });
    });
  }
  async privacyStatus(id: string, status: string, user: AuthStaffPayload) {
    const scope = await this.scope(user);
    return this.db.$transaction(
      async (tx) => {
        const request = await tx.dataPrivacyRequest.findFirst({ where: { id, ...scope } });
        if (!request) throw new NotFoundException('Privacy request not found');
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${request.userId}))`;
        if (['FULFILLED', 'REJECTED'].includes(request.status))
          throw new ConflictException('Request is already closed');
        if (status !== 'FULFILLED')
          return tx.dataPrivacyRequest.update({
            where: { id },
            data: { status },
            select: { id: true, status: true },
          });
        if (request.status !== 'PROCESSING')
          throw new ConflictException(
            'Review the request and move it to processing before fulfillment',
          );
        const isCustomer = request.userType === 'CUSTOMER';
        const account = isCustomer
          ? await tx.customer.findUniqueOrThrow({
              where: { id: request.userId },
              select: identitySelect,
            })
          : await tx.companion.findUniqueOrThrow({
              where: { id: request.userId },
              select: identitySelect,
            });
        if (request.requestType === 'DATA_EXPORT') {
          const bookings = await tx.booking.findMany({
            where: isCustomer ? { customerId: request.userId } : { companionId: request.userId },
            select: {
              bookingRef: true,
              status: true,
              startTime: true,
              endTime: true,
              activityLabel: true,
              bookingAmount: true,
              createdAt: true,
            },
          });
          const wallet = await tx.wallet.findFirst({
            where: isCustomer ? { customerId: request.userId } : { companionId: request.userId },
            select: {
              balance: true,
              currency: true,
              transactions: {
                select: { id: true, amount: true, transactionType: true, createdAt: true },
              },
            },
          });
          const exportJson = JSON.parse(
            JSON.stringify({
              account,
              bookings,
              wallet,
              generatedAt: new Date(),
              scope:
                'Account profile, booking history and wallet ledger. Other-party and security data excluded.',
            }),
          ) as Prisma.InputJsonValue;
          await tx.dataPrivacyRequest.update({
            where: { id },
            data: {
              status,
              exportJson,
              completedAt: new Date(),
              fulfillmentUrl: `/api/legal/data-privacy/${id}/export`,
            },
          });
        } else {
          if (
            request.legalHold ||
            (await tx.dataPrivacyRequest.count({
              where: { userId: request.userId, userType: request.userType, legalHold: true },
            })) ||
            (await tx.legalRequest.count({
              where: {
                targetUserId: request.userId,
                targetUserType: request.userType,
                preserveUntil: { gt: new Date() },
              },
            }))
          )
            throw new ConflictException('Legal hold prevents account deletion');
          const wallet = await tx.wallet.findFirst({
            where: isCustomer ? { customerId: request.userId } : { companionId: request.userId },
            select: { balance: true },
          });
          if (wallet && !wallet.balance.isZero())
            throw new ConflictException('Settle the wallet balance before deleting the account');
          if (
            isCustomer &&
            (await tx.customer.count({
              where: { id: request.userId, walletBalance: { not: 0 } },
            }))
          )
            throw new ConflictException('Settle the wallet balance before deleting the account');
          if (
            !isCustomer &&
            (await tx.payout.count({
              where: {
                companionId: request.userId,
                status: { in: ['PENDING', 'ON_HOLD', 'PROCESSING', 'FAILED'] },
              },
            }))
          )
            throw new ConflictException('Resolve outstanding payouts before deleting the account');
          if (
            await tx.booking.count({
              where: {
                ...(isCustomer ? { customerId: request.userId } : { companionId: request.userId }),
                status: { in: ['PENDING_COMPANION_ACCEPT', 'ARRIVING', 'IN_PROGRESS', 'EXTENDED'] },
              },
            })
          )
            throw new ConflictException('Finish active bookings before deleting the account');
          // Erase profile and payout destination identifiers after preservation and settlement
          // checks. Keep historical ledger references for separate retention review.
          const erased = {
            name: 'Deleted account',
            email: null,
            phone: `deleted-${request.userId}`,
            passwordHash: randomBytes(48).toString('hex'),
            profilePicUrl: null,
            dob: null,
            status: 'BANNED' as const,
            spokenLanguageIds: [],
          };
          if (isCustomer)
            await tx.customer.update({
              where: { id: request.userId },
              data: { ...erased, gender: null, preferenceJson: Prisma.DbNull },
            });
          else {
            await tx.companion.update({
              where: { id: request.userId },
              data: {
                ...erased,
                bio: null,
                headline: null,
                gender: 'UNSPECIFIED',
                interestIds: [],
                payoutPreference: null,
              },
            });
            await tx.bankAccount.updateMany({
              where: { companionId: request.userId },
              data: {
                accountName: 'Deleted account',
                ifscCode: '',
                accountNumber: '',
                accountLast4: '',
                upiId: null,
                verified: false,
                preferred: false,
              },
            });
            await tx.companionPromotion.deleteMany({ where: { companionId: request.userId } });
          }
          await tx.referralCode.updateMany({
            where: { ownerId: request.userId, ownerType: request.userType },
            data: { active: false },
          });
          await tx.supportTicket.updateMany({
            where: { userId: request.userId, userType: request.userType },
            data: { userName: 'Deleted account' },
          });
          await tx.dataPrivacyRequest.updateMany({
            where: { userId: request.userId, userType: request.userType },
            data: { exportJson: Prisma.DbNull, fulfillmentUrl: null },
          });
          await tx.dataPrivacyRequest.update({
            where: { id },
            data: {
              status,
              completedAt: new Date(),
              statusDetails:
                'Account access disabled; profile and payout destination identifiers erased. Historical financial, safety and legal records retained for retention review.',
            },
          });
        }
        return { id, status };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 },
    );
  }
  async export(id: string, user: AuthStaffPayload) {
    const request = await this.db.dataPrivacyRequest.findFirst({
      where: { id, ...(await this.scope(user)), requestType: 'DATA_EXPORT', status: 'FULFILLED' },
      select: { exportJson: true },
    });
    if (!request?.exportJson) throw new NotFoundException('Completed export not found');
    return request.exportJson;
  }
  async legal(user: AuthStaffPayload) {
    requireGlobal(user);
    const requests = await this.db.legalRequest.findMany({ orderBy: { createdAt: 'desc' } });
    const names = await this.names(requests.map((r) => r.targetUserId));
    return requests.map((r) => ({
      id: r.id,
      agencyName: r.authority,
      requestType: r.requestType,
      associatedUserId: r.targetUserId,
      associatedUserName: names.get(`${r.targetUserType}:${r.targetUserId}`) ?? r.targetUserId,
      userType: r.targetUserType,
      status: r.fulfillmentStatus,
      deadline: r.preserveUntil,
      receivedDate: r.createdAt,
      internalNotes: r.internalNotes,
      documentUrls: r.documentUrls,
      caseReference: r.caseReference,
    }));
  }
  async createLegal(input: LegalInput, user: AuthStaffPayload) {
    requireGlobal(user);
    await this.account(input.associatedUserId, input.userType, user);
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.associatedUserId}))`;
      return tx.legalRequest.create({
        data: {
          requestRef: `LGL-${randomUUID()}`,
          authority: input.agencyName,
          caseReference: input.caseReference,
          requestType: input.requestType,
          targetUserId: input.associatedUserId,
          targetUserType: input.userType,
          preserveUntil: new Date(input.deadline),
          fulfillmentStatus: 'OPEN',
          approvedByLegalId: user.sub,
          internalNotes: input.internalNotes,
          documentUrls: input.documentUrls,
        },
      });
    });
  }
  async legalStatus(id: string, status: string, user: AuthStaffPayload) {
    requireGlobal(user);
    const request = await this.db.legalRequest.findUniqueOrThrow({ where: { id } });
    const transitions: Record<string, string[]> = {
      OPEN: ['EVIDENCE_PRESERVED', 'CLOSED'],
      EVIDENCE_PRESERVED: ['RESPONSE_SENT', 'CLOSED'],
      RESPONSE_SENT: ['CLOSED'],
      CLOSED: [],
    };
    if (!transitions[request.fulfillmentStatus]?.includes(status))
      throw new ConflictException('Invalid legal request transition');
    if (['EVIDENCE_PRESERVED', 'RESPONSE_SENT'].includes(status) && !request.documentUrls.length)
      throw new ConflictException('Attach evidence or response records before changing status');
    const updated = await this.db.legalRequest.updateMany({
      where: { id, fulfillmentStatus: request.fulfillmentStatus },
      data: { fulfillmentStatus: status },
    });
    if (!updated.count) throw new ConflictException('Request changed; reload it');
    return { id, status };
  }
}
