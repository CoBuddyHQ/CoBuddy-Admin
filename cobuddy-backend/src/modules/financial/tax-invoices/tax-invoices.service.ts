import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { ListInvoicesDto } from './dto/tax-invoices.dto';

@Injectable()
export class TaxInvoicesService {
  constructor(private prisma: PrismaService) {}

  async list(dto: ListInvoicesDto) {
    const { page, pageSize, status, customerId, companionId, from, to } = dto;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TaxInvoiceWhereInput = {};
    if (status) where.status = status as InvoiceStatus;
    if (customerId) where.customerId = customerId;
    if (companionId) where.companionId = companionId;
    if (from || to) {
      where.invoiceDate = {};
      if (from) (where.invoiceDate as any).gte = new Date(from);
      if (to) (where.invoiceDate as any).lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      this.prisma.taxInvoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { invoiceDate: 'desc' },
      }),
      this.prisma.taxInvoice.count({ where }),
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

  async getOne(id: string) {
    const invoice = await this.prisma.taxInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return { data: invoice };
  }

  async issue(id: string, _user: AuthStaffPayload) {
    const updated = await this.transition(id, [InvoiceStatus.DRAFT], InvoiceStatus.ISSUED);
    return { data: updated, message: 'Invoice issued' };
  }

  async cancel(id: string, _user: AuthStaffPayload) {
    const updated = await this.transition(
      id,
      [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED],
      InvoiceStatus.CANCELLED,
    );
    return { data: updated, message: 'Invoice cancelled' };
  }

  async markPaid(id: string, _user: AuthStaffPayload) {
    const updated = await this.transition(id, [InvoiceStatus.ISSUED], InvoiceStatus.PAID);
    return { data: updated, message: 'Invoice marked as paid' };
  }

  private transition(id: string, allowed: InvoiceStatus[], status: InvoiceStatus) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.taxInvoice.findUnique({ where: { id } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (!allowed.includes(invoice.status))
        throw new BadRequestException('Invoice cannot change from its current state');
      const claim = await tx.taxInvoice.updateMany({
        where: { id, status: invoice.status },
        data: { status },
      });
      if (claim.count !== 1)
        throw new ConflictException('Invoice changed. Refresh before retrying.');
      return tx.taxInvoice.findUniqueOrThrow({ where: { id } });
    });
  }

  async summary() {
    const [draft, issued, paid, cancelled] = await Promise.all([
      this.prisma.taxInvoice.aggregate({
        where: { status: InvoiceStatus.DRAFT },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.taxInvoice.aggregate({
        where: { status: InvoiceStatus.ISSUED },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.taxInvoice.aggregate({
        where: { status: InvoiceStatus.PAID },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.taxInvoice.aggregate({
        where: { status: InvoiceStatus.CANCELLED },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    return {
      data: {
        draft: { count: draft._count, amount: draft._sum.totalAmount ?? 0 },
        issued: { count: issued._count, amount: issued._sum.totalAmount ?? 0 },
        paid: { count: paid._count, amount: paid._sum.totalAmount ?? 0 },
        cancelled: { count: cancelled._count, amount: cancelled._sum.totalAmount ?? 0 },
      },
    };
  }
}
