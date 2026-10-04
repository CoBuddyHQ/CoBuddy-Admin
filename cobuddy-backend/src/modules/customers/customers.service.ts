import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerStatusDto } from './dto/update-status.dto';
import { UpdateCustomerVerificationDto } from './dto/update-verification.dto';
import { AdjustWalletDto } from './dto/adjust-wallet.dto';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { applyCityScope } from '@/common/guards/city-scope.guard';
import { Prisma, TransactionType, WalletTransactionCategory } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { CUSTOMER_PUBLIC_SELECT } from '@/common/public-selects';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: CustomerQueryDto, req: any) {
    let where: Prisma.CustomerWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.verificationStatus) where.verificationStatus = q.verificationStatus;
    if (q.cityId) where.cityId = q.cityId;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
        { email: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    where = applyCityScope(where, req);

    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          ...CUSTOMER_PUBLIC_SELECT,
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
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        ...CUSTOMER_PUBLIC_SELECT,
        city: { select: { id: true, name: true } },
        wallet: true,
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return { data: customer };
  }

  async updateStatus(id: string, dto: UpdateCustomerStatusDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status: dto.status },
      select: CUSTOMER_PUBLIC_SELECT,
    });
    return { data: updated, message: `Customer status updated to ${dto.status}` };
  }

  async updateVerificationStatus(id: string, dto: UpdateCustomerVerificationDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { verificationStatus: dto.verificationStatus },
      select: CUSTOMER_PUBLIC_SELECT,
    });
    return { data: updated, message: `Verification status updated to ${dto.verificationStatus}` };
  }

  async getReports(id: string, q: PaginationQueryDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    const where: Prisma.UserReportWhereInput = {
      OR: [
        { AND: [{ reportedUserId: id }, { reportedUserType: 'CUSTOMER' }] },
        { AND: [{ reporterId: id }, { reporterType: 'CUSTOMER' }] },
      ],
    };

    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.userReport.count({ where }),
      this.prisma.userReport.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
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

  async adjustWallet(id: string, dto: AdjustWalletDto, admin: AuthStaffPayload) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { customerId: id },
        update: {},
        create: {
          ownerType: 'CUSTOMER',
          customerId: id,
          currency: 'INR',
          balance: 0,
          ledgerVersion: 0,
        },
      });

      const amount = new Prisma.Decimal(dto.amount);
      if (!amount.isPositive() || amount.decimalPlaces() > 2)
        throw new BadRequestException('Amount must be positive with at most two decimal places');

      const balanceOperation =
        dto.type === TransactionType.CREDIT ? { increment: amount } : { decrement: amount };

      const category =
        dto.type === TransactionType.CREDIT
          ? WalletTransactionCategory.DISPUTE_CREDIT
          : WalletTransactionCategory.DISPUTE_DEBIT;

      // Check funds in the write itself; the row lock is held until the ledger commits.
      const claim = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          ...(dto.type === TransactionType.DEBIT ? { balance: { gte: amount } } : {}),
        },
        data: {
          balance: balanceOperation,
          ledgerVersion: { increment: 1 },
          lastTopupAt: dto.type === TransactionType.CREDIT ? new Date() : undefined,
          lastSpendAt: dto.type === TransactionType.DEBIT ? new Date() : undefined,
        },
      });
      if (claim.count !== 1) throw new BadRequestException('Insufficient wallet balance');
      const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

      const txn = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: dto.type,
          category,
          amount: dto.amount,
          balanceAfter: updatedWallet.balance,
          description: dto.description,
          metadata: {
            adjustedBy: admin.sub,
            adjustedByName: admin.name,
            manualAdjustment: true,
          },
        },
      });

      await tx.customer.update({
        where: { id },
        data: { walletBalance: updatedWallet.balance },
      });

      return { wallet: updatedWallet, transaction: txn };
    });

    return {
      data: result,
      message: `Wallet ${dto.type.toLowerCase()}ed by ${dto.amount}`,
    };
  }

  async getTickets(id: string, q: PaginationQueryDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    const where = { userId: id, userType: 'CUSTOMER' };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
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
}
