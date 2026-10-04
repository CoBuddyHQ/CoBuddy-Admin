import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { addDuration } from '@/lib/date-util';
import { PrismaService } from '@/prisma/prisma.module';
import { EmployeeStatus, InviteStatus, StaffRole, Prisma } from '@prisma/client';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateRolesDto } from './dto/update-roles.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { validateSortBy } from '@/common/dto/pagination.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { InvitationMailer } from './invitation-mailer.service';

const EMPLOYEE_SELECT = {
  id: true,
  employeeId: true,
  name: true,
  email: true,
  phone: true,
  designation: true,
  department: true,
  reportingManagerId: true,
  roles: true,
  cityScopeIds: true,
  status: true,
  inviteStatus: true,
  inviteExpiresAt: true,
  twoFactorEnabled: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private invitations: InvitationMailer,
  ) {}

  private assertCanManage(
    actor: AuthStaffPayload,
    existingRoles: StaffRole[] = [],
    newRoles: StaffRole[] = [],
  ) {
    if (actor.roles.includes(StaffRole.SUPER_ADMIN)) return;
    if (existingRoles.includes(StaffRole.SUPER_ADMIN) || newRoles.includes(StaffRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Only a super admin may manage or assign the super admin role');
    }
  }

  private generateInviteToken(): { token: string; expires: Date } {
    const token = randomUUID();
    const expires = addDuration('7d');
    return { token, expires };
  }

  async findAll(q: EmployeeQueryDto) {
    const where: Prisma.StaffEmployeeWhereInput = {};
    if (q.department) where.department = q.department;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { employeeId: { contains: q.search, mode: 'insensitive' } },
        { designation: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.status) where.status = q.status as EmployeeStatus;
    if (q.cityId) where.cityScopeIds = { has: q.cityId };
    if (q.roles && q.roles.length > 0) {
      where.roles = { hasSome: q.roles as StaffRole[] };
    }

    const sortField = validateSortBy('staffEmployees', q.sortBy);
    const sortOrder = q.sortOrder || 'desc';

    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.staffEmployee.count({ where }),
      this.prisma.staffEmployee.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ [sortField]: sortOrder }, { id: 'asc' }],
        select: EMPLOYEE_SELECT,
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
      message: 'Employees fetched',
    };
  }

  async findOne(id: string) {
    const emp = await this.prisma.staffEmployee.findUnique({
      where: { id },
      select: EMPLOYEE_SELECT,
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return { data: emp, message: 'Employee fetched' };
  }

  async create(dto: CreateEmployeeDto, actor: AuthStaffPayload) {
    this.assertCanManage(actor, [], dto.roles);
    this.assertValidCityScope(dto.roles, dto.cityScopeIds || []);
    dto.email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.staffEmployee.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const employeeId = `EMP-${randomUUID()}`;
    const { token, expires } = this.generateInviteToken();
    const tempPassword = await bcrypt.hash(randomUUID(), 10);

    const emp = await this.prisma.staffEmployee.create({
      data: {
        employeeId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        designation: dto.designation,
        department: dto.department,
        reportingManagerId: dto.reportingManagerId || null,
        roles: dto.roles,
        cityScopeIds: dto.cityScopeIds || [],
        passwordHash: tempPassword,
        inviteToken: token,
        inviteExpiresAt: expires,
        inviteStatus: InviteStatus.PENDING,
      },
      select: EMPLOYEE_SELECT,
    });

    const invitationDelivery = await this.invitations.send(emp.id, emp.email, token);
    return {
      data: { ...emp, invitationDelivery },
      message:
        invitationDelivery === 'SENT'
          ? 'Employee created and invitation sent'
          : 'Employee created; invitation not delivered. Configure email and resend.',
    };
  }

  async update(id: string, dto: UpdateEmployeeDto, actor: AuthStaffPayload) {
    const existing = await this.prisma.staffEmployee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    this.assertCanManage(actor, existing.roles);
    if (dto.email) dto.email = dto.email.trim().toLowerCase();
    if (dto.email && dto.email !== existing.email) {
      const dup = await this.prisma.staffEmployee.findUnique({ where: { email: dto.email } });
      if (dup) throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.staffEmployee.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.designation !== undefined && { designation: dto.designation }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.reportingManagerId !== undefined && { reportingManagerId: dto.reportingManagerId }),
      },
      select: EMPLOYEE_SELECT,
    });

    return { data: updated, message: 'Employee updated' };
  }

  async updateRoles(id: string, dto: UpdateRolesDto, actor: AuthStaffPayload) {
    if (!dto.roles.length) throw new BadRequestException('At least one role is required');
    const emp = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.staffEmployee.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Employee not found');
        this.assertCanManage(actor, existing.roles, dto.roles);
        this.assertValidCityScope(dto.roles, dto.cityScopeIds ?? existing.cityScopeIds);
        if (
          existing.roles.includes(StaffRole.SUPER_ADMIN) &&
          !dto.roles.includes(StaffRole.SUPER_ADMIN)
        ) {
          if (id === actor.sub)
            throw new BadRequestException('You cannot remove your own super admin role');
          await this.assertAnotherActiveAdmin(tx, id);
        }
        return tx.staffEmployee.update({
          where: { id },
          data: { roles: dto.roles, cityScopeIds: dto.cityScopeIds ?? existing.cityScopeIds },
          select: EMPLOYEE_SELECT,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { data: emp, message: 'Roles and scope updated' };
  }

  async updateStatus(id: string, dto: UpdateStatusDto, actor: AuthStaffPayload) {
    const emp = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.staffEmployee.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Employee not found');
        this.assertCanManage(actor, existing.roles);
        if (dto.status === EmployeeStatus.SUSPENDED) {
          if (id === actor.sub)
            throw new BadRequestException('You cannot suspend your own account');
          if (existing.roles.includes(StaffRole.SUPER_ADMIN))
            await this.assertAnotherActiveAdmin(tx, id);
        }
        const updated = await tx.staffEmployee.update({
          where: { id },
          data: { status: dto.status },
          select: EMPLOYEE_SELECT,
        });
        if (dto.status === EmployeeStatus.SUSPENDED) {
          await tx.staffSession.deleteMany({ where: { employeeId: id } });
        }
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { data: emp, message: `Employee status set to ${dto.status}` };
  }

  private async assertAnotherActiveAdmin(tx: Prisma.TransactionClient, id: string) {
    const count = await tx.staffEmployee.count({
      where: {
        id: { not: id },
        roles: { has: StaffRole.SUPER_ADMIN },
        status: EmployeeStatus.ACTIVE,
        inviteStatus: InviteStatus.ACCEPTED,
      },
    });
    if (count === 0)
      throw new BadRequestException('At least one active, accepted super admin must remain');
  }

  private assertValidCityScope(roles: StaffRole[], cityScopeIds: string[]) {
    if (roles.includes(StaffRole.CITY_OPS_MANAGER) && cityScopeIds.length === 0) {
      throw new BadRequestException('City operations managers require at least one city scope');
    }
  }

  async resendInvite(id: string, actor: AuthStaffPayload) {
    const existing = await this.prisma.staffEmployee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');
    this.assertCanManage(actor, existing.roles);
    if (existing.inviteStatus === InviteStatus.ACCEPTED) {
      throw new BadRequestException('Invite already accepted');
    }

    const { token, expires } = this.generateInviteToken();
    const claim = await this.prisma.staffEmployee.updateMany({
      where: {
        id,
        inviteStatus: InviteStatus.PENDING,
        inviteToken: existing.inviteToken,
        status: EmployeeStatus.ACTIVE,
      },
      data: { inviteToken: token, inviteExpiresAt: expires },
    });
    if (claim.count !== 1) throw new ConflictException('Invitation changed or account is inactive');
    const invitationDelivery = await this.invitations.send(id, existing.email, token);

    return {
      data: { invitationDelivery, inviteExpiresAt: expires },
      message:
        invitationDelivery === 'SENT'
          ? 'Invitation sent'
          : 'Invitation not delivered. Configure email and resend.',
    };
  }

  async acceptInvite(dto: AcceptInviteDto, id: string) {
    const emp = await this.prisma.staffEmployee.findUnique({
      where: { inviteToken: dto.token },
    });
    if (!emp || emp.id !== id) throw new BadRequestException('Invalid invite token');
    if (emp.inviteStatus === InviteStatus.ACCEPTED) {
      throw new BadRequestException('Invite already accepted');
    }
    if (!emp.inviteExpiresAt || emp.inviteExpiresAt < new Date()) {
      throw new ForbiddenException('Invite expired');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.staffEmployee.updateMany({
        where: {
          id,
          inviteToken: dto.token,
          inviteStatus: InviteStatus.PENDING,
          inviteExpiresAt: { gt: new Date() },
          status: EmployeeStatus.ACTIVE,
        },
        data: {
          passwordHash,
          inviteStatus: InviteStatus.ACCEPTED,
          inviteToken: null,
          inviteExpiresAt: null,
        },
      });
      if (claim.count !== 1)
        throw new ConflictException('Invite expired, revoked or already accepted');
      return tx.staffEmployee.findUniqueOrThrow({ where: { id }, select: EMPLOYEE_SELECT });
    });

    return { data: updated, message: 'Invite accepted, password set' };
  }

  async forceLogout(id: string, actor: AuthStaffPayload) {
    const existing = await this.prisma.staffEmployee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    const employee = await this.prisma.staffEmployee.findUnique({
      where: { id },
      select: { roles: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    this.assertCanManage(actor, employee.roles);
    const count = await this.prisma.staffSession.deleteMany({ where: { employeeId: id } });
    return {
      data: { sessionsRemoved: count.count },
      message: 'All sessions revoked for employee',
    };
  }
}
