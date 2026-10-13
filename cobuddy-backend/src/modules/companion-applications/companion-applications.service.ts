import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import {
  CompanionApplicationQueryDto,
  APPLICATION_STATUSES,
} from './dto/companion-application-query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import { AddApplicationNoteDto } from './dto/add-application-note.dto';
import { applyCityScope } from '@/common/guards/city-scope.guard';
import { CompanionApplication, Prisma, UserStatus, UserVerificationStatus } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { COMPANION_PUBLIC_SELECT } from '@/common/public-selects';

@Injectable()
export class CompanionApplicationsService {
  constructor(private prisma: PrismaService) {}

  private async enrich(applications: CompanionApplication[]) {
    const [cities, staff] = await Promise.all([
      this.prisma.city.findMany({
        where: { id: { in: applications.map((a) => a.cityId) } },
        select: { id: true, name: true },
      }),
      this.prisma.staffEmployee.findMany({
        where: {
          id: {
            in: applications.flatMap((a) =>
              [a.reviewedByStaffId, a.interviewerStaffId].filter((id): id is string => !!id),
            ),
          },
        },
        select: { id: true, name: true },
      }),
    ]);
    return applications.map((application) => ({
      ...application,
      city: cities.find((c) => c.id === application.cityId) ?? null,
      reviewedBy: staff.find((s) => s.id === application.reviewedByStaffId) ?? null,
      interview: application.interviewScheduledAt
        ? {
            scheduledAt: application.interviewScheduledAt,
            interviewerStaffId: application.interviewerStaffId,
            interviewer: staff.find((s) => s.id === application.interviewerStaffId) ?? null,
            meetingLink: application.interviewMeetingLink,
          }
        : null,
    }));
  }

  private async application(id: string, admin?: AuthStaffPayload) {
    const application = await this.prisma.companionApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    if (
      admin &&
      !admin.roles?.includes('SUPER_ADMIN') &&
      (admin.cityScopeIds?.length || admin.roles?.includes('CITY_OPS_MANAGER')) &&
      !admin.cityScopeIds?.includes(application.cityId)
    )
      throw new NotFoundException('Application not found');
    return application;
  }

  private assertReviewable(application: CompanionApplication, admin: AuthStaffPayload) {
    if (application.companionId || ['APPROVED', 'REJECTED'].includes(application.applicationStatus))
      throw new ConflictException('This application is already closed');
    if (application.reviewedByStaffId && application.reviewedByStaffId !== admin.sub)
      throw new ConflictException('This application is assigned to another reviewer');
  }

  async assignSelf(id: string, admin: AuthStaffPayload) {
    const application = await this.application(id, admin);
    this.assertReviewable(application, admin);
    if (
      application.reviewedByStaffId === admin.sub &&
      ['SCREENING', 'IN_REVIEW', 'INTERVIEW_SCHEDULED'].includes(application.applicationStatus)
    )
      return this.findOne(id, admin);
    if (
      ![
        'SUBMITTED',
        'PENDING',
        'SCREENING',
        'IN_REVIEW',
        'WAITLISTED',
        'INTERVIEW_SCHEDULED',
      ].includes(application.applicationStatus)
    )
      throw new ConflictException('This application cannot be assigned in its current state');
    const result = await this.prisma.companionApplication.updateMany({
      where: {
        id,
        applicationStatus: application.applicationStatus,
        reviewedByStaffId: application.reviewedByStaffId,
        companionId: null,
      },
      data: {
        applicationStatus:
          application.applicationStatus === 'INTERVIEW_SCHEDULED'
            ? 'INTERVIEW_SCHEDULED'
            : 'SCREENING',
        reviewedByStaffId: admin.sub,
      },
    });
    if (!result.count) throw new ConflictException('Application changed. Reload and try again.');
    return this.findOne(id, admin);
  }

  async findAll(q: CompanionApplicationQueryDto, req: any) {
    let where: Prisma.CompanionApplicationWhereInput = {};
    if (q.status) {
      where.applicationStatus =
        q.status === 'SUBMITTED'
          ? { in: ['SUBMITTED', 'PENDING'] }
          : q.status === 'SCREENING'
            ? { in: ['SCREENING', 'IN_REVIEW'] }
            : q.status;
    }
    if (q.cityId) where.cityId = q.cityId;
    if (q.search) {
      where.OR = [
        { firstName: { contains: q.search, mode: 'insensitive' } },
        { lastName: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
        { email: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    where = applyCityScope(where, req);

    const [totalItems, list] = await this.prisma.$transaction([
      this.prisma.companionApplication.count({ where }),
      this.prisma.companionApplication.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    ]);
    const totalPages = Math.ceil(totalItems / q.pageSize);
    return {
      data: await this.enrich(list),
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

  async findOne(id: string, admin?: AuthStaffPayload) {
    const application = await this.application(id, admin);
    return { data: (await this.enrich([application]))[0] };
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, admin: AuthStaffPayload) {
    const application = await this.application(id, admin);
    this.assertReviewable(application, admin);
    if (!APPLICATION_STATUSES.includes(dto.status as any)) {
      throw new BadRequestException('Invalid status');
    }

    if (['APPROVED', 'REJECTED'].includes(dto.status))
      throw new BadRequestException('Use the approval or rejection action to close an application');
    if (dto.status === 'INTERVIEW_SCHEDULED')
      throw new BadRequestException('Use the schedule interview action to record an appointment');
    const updated = await this.prisma.companionApplication.updateMany({
      where: {
        id,
        applicationStatus: application.applicationStatus,
        reviewedByStaffId: application.reviewedByStaffId,
        companionId: null,
      },
      data: {
        applicationStatus: dto.status,
        reviewNotes: dto.reviewNotes,
        reviewedByStaffId: ['WAITLISTED', 'SUBMITTED'].includes(dto.status) ? null : admin.sub,
        interviewScheduledAt: null,
        interviewerStaffId: null,
        interviewMeetingLink: null,
      },
    });
    if (!updated.count) throw new ConflictException('Application changed. Reload and try again.');
    return {
      ...(await this.findOne(id, admin)),
      message: `Application status updated to ${dto.status}`,
    };
  }

  private interviewerWhere(cityId: string): Prisma.StaffEmployeeWhereInput {
    return {
      status: 'ACTIVE',
      inviteStatus: 'ACCEPTED',
      roles: { hasSome: ['MODERATOR', 'SUPER_ADMIN'] },
      OR: [
        { roles: { has: 'SUPER_ADMIN' } },
        { cityScopeIds: { has: cityId } },
        { cityScopeIds: { isEmpty: true }, NOT: { roles: { has: 'CITY_OPS_MANAGER' } } },
      ],
    };
  }

  async interviewers(id: string, admin: AuthStaffPayload) {
    const application = await this.application(id, admin);
    this.assertReviewable(application, admin);
    return {
      data: await this.prisma.staffEmployee.findMany({
        where: this.interviewerWhere(application.cityId),
        select: { id: true, name: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
    };
  }

  async scheduleInterview(id: string, dto: ScheduleInterviewDto, admin: AuthStaffPayload) {
    const application = await this.application(id, admin);
    this.assertReviewable(application, admin);
    if (!Number.isFinite(dto.scheduledAt?.getTime()) || dto.scheduledAt.getTime() <= Date.now())
      throw new BadRequestException('Interview must be scheduled in the future');

    const interviewer = await this.prisma.staffEmployee.findFirst({
      where: { id: dto.interviewerStaffId, ...this.interviewerWhere(application.cityId) },
      select: { id: true },
    });
    if (!interviewer)
      throw new BadRequestException('Select an active reviewer with access to this city');

    const updated = await this.prisma.companionApplication.updateMany({
      where: {
        id,
        applicationStatus: application.applicationStatus,
        reviewedByStaffId: application.reviewedByStaffId,
        companionId: null,
        updatedAt: application.updatedAt,
      },
      data: {
        applicationStatus: 'INTERVIEW_SCHEDULED',
        reviewedByStaffId: admin.sub,
        interviewScheduledAt: dto.scheduledAt,
        interviewerStaffId: dto.interviewerStaffId,
        interviewMeetingLink: dto.meetingLink ?? null,
      },
    });
    if (!updated.count) throw new ConflictException('Application changed. Reload and try again.');
    const saved = (await this.findOne(id, admin)).data;

    return {
      data: {
        application: saved,
        interview: saved.interview,
      },
      message: 'Interview scheduled successfully',
    };
  }

  async approve(id: string, admin: AuthStaffPayload, notes?: string) {
    const application = await this.application(id, admin);
    this.assertReviewable(application, admin);

    const passwordHash = await bcrypt.hash(randomUUID(), 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.companionApplication.updateMany({
        where: {
          id,
          applicationStatus: application.applicationStatus,
          reviewedByStaffId: application.reviewedByStaffId,
          companionId: null,
        },
        data: { applicationStatus: 'APPROVED', reviewedByStaffId: admin.sub, reviewNotes: notes },
      });
      if (!claimed.count) throw new ConflictException('Application changed. Reload and try again.');
      const companion = await tx.companion.create({
        data: {
          name: `${application.firstName} ${application.lastName}`,
          email: application.email,
          phone: application.phone,
          passwordHash,
          cityId: application.cityId,
          status: UserStatus.ACTIVE,
          verificationStatus: UserVerificationStatus.PENDING,
          gender: 'OTHER',
        },
        select: COMPANION_PUBLIC_SELECT,
      });

      await tx.wallet.create({
        data: {
          ownerType: 'COMPANION',
          companionId: companion.id,
          currency: 'INR',
          balance: 0,
          ledgerVersion: 0,
        },
      });

      const updatedApplication = await tx.companionApplication.update({
        where: { id },
        data: {
          applicationStatus: 'APPROVED',
          companionId: companion.id,
          reviewedByStaffId: admin.sub,
          reviewNotes: notes,
        },
      });

      return { companion, application: updatedApplication };
    });

    return {
      data: result,
      message: 'Application approved. Companion account and wallet created.',
    };
  }

  async reject(id: string, dto: RejectApplicationDto, admin: AuthStaffPayload) {
    const application = await this.application(id, admin);
    this.assertReviewable(application, admin);

    const updated = await this.prisma.companionApplication.updateMany({
      where: {
        id,
        applicationStatus: application.applicationStatus,
        reviewedByStaffId: application.reviewedByStaffId,
        companionId: null,
      },
      data: {
        applicationStatus: 'REJECTED',
        reviewNotes: dto.reason,
        reviewedByStaffId: admin.sub,
      },
    });
    if (!updated.count) throw new ConflictException('Application changed. Reload and try again.');
    return { ...(await this.findOne(id, admin)), message: 'Application rejected' };
  }

  async addNote(id: string, dto: AddApplicationNoteDto, admin: AuthStaffPayload) {
    const application = await this.application(id, admin);

    const existingNotes = (application.reviewNotes as any) || '';
    const newNote = `[${new Date().toISOString()}] ${admin.name}: ${dto.note}`;
    const combinedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    const updated = await this.prisma.companionApplication.update({
      where: { id },
      data: {
        reviewNotes: combinedNotes,
      },
    });
    return { data: updated, message: 'Note added to application' };
  }
}
