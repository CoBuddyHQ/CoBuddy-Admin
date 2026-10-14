import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SupportTicketStatus, TicketEscalationLevel } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { cityWhere, scopedCities } from '@/common/auth/city-scope';
import { TicketInput } from '@/common/validation/workflow-inputs';

const supportRoles = ['SUPPORT_AGENT', 'SUPPORT_LEAD', 'MODERATOR', 'SUPER_ADMIN'] as const;
const include = {
  assignedTo: { select: { id: true, name: true } },
  messages: { orderBy: { createdAt: 'asc' as const } },
};
const isClosed = (status: string) => ['RESOLVED', 'CLOSED'].includes(status);

@Injectable()
export class SupportService {
  constructor(private readonly db: PrismaService) {}
  private scope(user: AuthStaffPayload): Prisma.SupportTicketWhereInput {
    return scopedCities(user)
      ? { OR: [{ customer: cityWhere(user) }, { companion: cityWhere(user) }] }
      : {};
  }
  async agents(user: AuthStaffPayload) {
    const cities = scopedCities(user);
    return this.db.staffEmployee.findMany({
      where: {
        status: 'ACTIVE',
        inviteStatus: 'ACCEPTED',
        roles: { hasSome: [...supportRoles] },
        ...(cities
          ? { OR: [{ cityScopeIds: { isEmpty: true } }, { cityScopeIds: { hasSome: cities } }] }
          : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
  async tickets(user: AuthStaffPayload) {
    return (
      await this.db.supportTicket.findMany({
        where: this.scope(user),
        include,
        orderBy: { createdAt: 'desc' },
      })
    ).map((t) => ({
      ...t,
      category: t.categoryCode,
      priority: t.priority === 'CRITICAL' ? 'URGENT' : t.priority,
      assignedTo: t.assignedTo?.name,
      assignedToId: t.assignedToId,
      thread: t.messages.map((m) => ({
        sender: m.senderType === 'STAFF' ? 'Support' : t.userName,
        message: m.message,
        timestamp: m.createdAt,
      })),
      messages: undefined,
    }));
  }
  async create(input: TicketInput, user: AuthStaffPayload) {
    const where = { id: input.userId, ...cityWhere(user) };
    const account =
      input.userType === 'CUSTOMER'
        ? await this.db.customer.findFirst({ where, select: { name: true } })
        : await this.db.companion.findFirst({ where, select: { name: true } });
    if (!account) throw new NotFoundException('Account not found');
    const hours = { LOW: 72, MEDIUM: 24, HIGH: 4, CRITICAL: 1 }[input.priority];
    return this.db.supportTicket.create({
      data: {
        ticketRef: `TKT-${randomUUID()}`,
        userId: input.userId,
        userName: account.name,
        userType: input.userType,
        customerId: input.userType === 'CUSTOMER' ? input.userId : null,
        companionId: input.userType === 'COMPANION' ? input.userId : null,
        categoryCode: input.categoryCode,
        priority: input.priority,
        subject: input.subject,
        slaDeadline: input.slaDeadline
          ? new Date(input.slaDeadline)
          : new Date(Date.now() + hours * 3600000),
        messages: {
          create: {
            senderId: user.sub,
            senderType: 'STAFF',
            message: input.message,
            attachmentUrls: [],
          },
        },
        audit: { create: { event: 'CREATED', actorId: user.sub } },
      },
    });
  }
  private async mutate(
    id: string,
    user: AuthStaffPayload,
    action: (
      tx: Prisma.TransactionClient,
      ticket: Prisma.SupportTicketGetPayload<{
        include: {
          customer: { select: { cityId: true } };
          companion: { select: { cityId: true } };
        };
      }>,
    ) => Promise<unknown>,
  ) {
    return this.db.$transaction(
      async (tx) => {
        const ticket = await tx.supportTicket.findFirst({
          where: { id, ...this.scope(user) },
          include: {
            customer: { select: { cityId: true } },
            companion: { select: { cityId: true } },
          },
        });
        if (!ticket) throw new NotFoundException('Ticket not found');
        return action(tx, ticket);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  private canWork(assignedToId: string | null, user: AuthStaffPayload) {
    if (
      assignedToId &&
      assignedToId !== user.sub &&
      !user.roles.some((r) => ['SUPER_ADMIN', 'SUPPORT_LEAD'].includes(r))
    )
      throw new ForbiddenException(
        'Only the assigned agent or a support lead can change this ticket',
      );
  }
  status(
    id: string,
    status: SupportTicketStatus,
    note: string | undefined,
    user: AuthStaffPayload,
  ) {
    return this.mutate(id, user, async (tx, ticket) => {
      this.canWork(ticket.assignedToId, user);
      const transitions: Record<string, string[]> = {
        OPEN: ['IN_PROGRESS', 'RESOLVED'],
        IN_PROGRESS: ['OPEN', 'RESOLVED'],
        PENDING_USER: ['IN_PROGRESS', 'RESOLVED'],
        ESCALATED: ['IN_PROGRESS', 'RESOLVED'],
        RESOLVED: ['OPEN', 'CLOSED'],
        CLOSED: ['OPEN'],
      };
      if (!transitions[ticket.status]?.includes(status))
        throw new ConflictException('Invalid ticket status transition');
      await tx.ticketAuditEvent.create({
        data: {
          ticketId: id,
          actorId: user.sub,
          event: 'STATUS_CHANGED',
          oldValue: { status: ticket.status },
          newValue: { status, resolutionNote: note ?? null },
        },
      });
      return tx.supportTicket.update({
        where: { id },
        data: {
          status,
          resolutionNote: note ?? null,
          resolvedAt: isClosed(status) ? (ticket.resolvedAt ?? new Date()) : null,
        },
      });
    });
  }
  reply(id: string, message: string, user: AuthStaffPayload) {
    return this.mutate(id, user, async (tx, ticket) => {
      this.canWork(ticket.assignedToId, user);
      if (isClosed(ticket.status)) throw new ConflictException('Reopen the ticket before replying');
      await tx.ticketAuditEvent.create({
        data: { ticketId: id, actorId: user.sub, event: 'STAFF_REPLY' },
      });
      return tx.ticketMessage.create({
        data: {
          ticketId: id,
          senderId: user.sub,
          senderType: 'STAFF',
          message,
          attachmentUrls: [],
        },
      });
    });
  }
  assign(id: string, staffId: string | null, user: AuthStaffPayload, self = false) {
    if (!self && !user.roles.some((r) => ['SUPER_ADMIN', 'SUPPORT_LEAD'].includes(r)))
      throw new ForbiddenException('Reassignment requires a support lead');
    return this.mutate(id, user, async (tx, ticket) => {
      if (isClosed(ticket.status))
        throw new ConflictException('Reopen the ticket before assigning');
      if (self && ticket.assignedToId && ticket.assignedToId !== user.sub)
        throw new ConflictException('Another agent already owns this ticket');
      if (staffId) {
        const staff = await tx.staffEmployee.findFirst({
          where: {
            id: staffId,
            status: 'ACTIVE',
            inviteStatus: 'ACCEPTED',
            roles: { hasSome: [...supportRoles] },
          },
          select: { id: true, roles: true, cityScopeIds: true },
        });
        const city = ticket.customer?.cityId ?? ticket.companion?.cityId;
        if (
          !staff ||
          (!staff.roles.includes('SUPER_ADMIN') &&
            (staff.cityScopeIds.length > 0 || staff.roles.includes('CITY_OPS_MANAGER')) &&
            (!city || !staff.cityScopeIds.includes(city)))
        )
          throw new ForbiddenException('Agent is unavailable or outside the ticket city scope');
      }
      await tx.ticketAuditEvent.create({
        data: {
          ticketId: id,
          actorId: user.sub,
          event: 'ASSIGNED',
          oldValue: { staffId: ticket.assignedToId },
          newValue: { staffId },
        },
      });
      return tx.supportTicket.update({ where: { id }, data: { assignedToId: staffId } });
    });
  }
  escalate(id: string, user: AuthStaffPayload) {
    return this.mutate(id, user, async (tx, ticket) => {
      this.canWork(ticket.assignedToId, user);
      if (ticket.escalationLevel === 'L3' || isClosed(ticket.status))
        throw new ConflictException('Ticket cannot be escalated further');
      const level: TicketEscalationLevel = ticket.escalationLevel === 'L1' ? 'L2' : 'L3';
      await tx.ticketAuditEvent.create({
        data: { ticketId: id, actorId: user.sub, event: 'ESCALATED', newValue: { level } },
      });
      return tx.supportTicket.update({
        where: { id },
        data: { escalationLevel: level, status: 'ESCALATED' },
      });
    });
  }
  async alerts(user: AuthStaffPayload) {
    const now = Date.now();
    const tickets = await this.db.supportTicket.findMany({
      where: {
        ...this.scope(user),
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaDeadline: { lte: new Date(now + 3600000) },
      },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { slaDeadline: 'asc' },
    });
    return tickets.map((t) => ({
      id: t.id,
      ticketId: t.id,
      agentName: t.assignedTo?.name ?? 'Unassigned',
      category: t.categoryCode,
      priority: t.priority,
      timeRemainingMs: t.slaDeadline!.getTime() - now,
      status: t.slaDeadline!.getTime() < now ? 'BREACHED' : 'WARNING',
    }));
  }
  async performance(user: AuthStaffPayload) {
    const tickets = await this.db.supportTicket.findMany({
      where: { ...this.scope(user), assignedToId: { not: null } },
      include: { assignedTo: { select: { name: true } } },
    });
    const rows = new Map<
      string,
      {
        agentId: string;
        agentName: string;
        ticketsResolved: number;
        averageResolutionTimeMs: number;
        slaBreaches: number;
        activeTickets: number;
        measuredResolutions: number;
      }
    >();
    for (const t of tickets) {
      const id = t.assignedToId!;
      const row = rows.get(id) ?? {
        agentId: id,
        agentName: t.assignedTo!.name,
        ticketsResolved: 0,
        averageResolutionTimeMs: 0,
        slaBreaches: 0,
        activeTickets: 0,
        measuredResolutions: 0,
      };
      if (isClosed(t.status)) {
        row.ticketsResolved++;
        if (t.resolvedAt) {
          row.averageResolutionTimeMs += t.resolvedAt.getTime() - t.createdAt.getTime();
          row.measuredResolutions++;
        }
      } else row.activeTickets++;
      if (
        t.slaDeadline &&
        (t.resolvedAt?.getTime() ?? (isClosed(t.status) ? 0 : Date.now())) > t.slaDeadline.getTime()
      )
        row.slaBreaches++;
      rows.set(id, row);
    }
    return [...rows.values()].map((r) => ({
      ...r,
      averageResolutionTimeMs: r.measuredResolutions
        ? r.averageResolutionTimeMs / r.measuredResolutions
        : null,
    }));
  }
}
