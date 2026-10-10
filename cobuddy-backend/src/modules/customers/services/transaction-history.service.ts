import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

@Injectable()
export class TransactionHistoryService {
  constructor(private prisma: PrismaService) {}

  async getTransactions(customerId: string, q: PaginationQueryDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { customerId },
      select: { id: true },
    });
    if (!wallet) throw new NotFoundException('Customer wallet not found');

    const where = { walletId: wallet.id };
    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
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
