import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { Prisma, UserStatus, UserVerificationStatus } from '@prisma/client';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { COMPANION_PUBLIC_SELECT } from '@/common/public-selects';

@Injectable()
export class CompanionApplicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: CompanionApplicationQueryDto, req: any) {
    let where: Prisma.CompanionApplicationWhereInput = {};
    if (q.status) where.applicationStatus = q.status;
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

  async findOne(id: string) {
    const application = await this.prisma.companionApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Application not found');
    return { data: application };
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, admin: AuthStaffPayload) {
    const application = await this.prisma.companionApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    if (!APPLICATION_STATUSES.includes(dto.status as any)) {
      throw new BadRequestException('Invalid status');
    }

    const updated = await this.prisma.companionApplication.update({
      where: { id },
      data: {
        applicationStatus: dto.status,
        reviewNotes: dto.reviewNotes,
        reviewedByStaffId: admin.sub,
      },
    });
    return { data: updated, message: `Application status updated to ${dto.status}` };
  }

  async scheduleInterview(id: string, dto: ScheduleInterviewDto) {
    const application = await this.prisma.companionApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');

    const interviewer = await this.prisma.staffEmployee.findUnique({
      where: { id: dto.interviewerStaffId },
    });
    if (!interviewer) throw new NotFoundException('Interviewer staff not found');

    const updated = await this.prisma.companionApplication.update({
      where: { id },
      data: {
        applicationStatus: 'INTERVIEW_SCHEDULED',
      },
    });

    return {
      data: {
        application: updated,
        interview: {
          scheduledAt: dto.scheduledAt,
          interviewerStaffId: dto.interviewerStaffId,
          meetingLink: dto.meetingLink,
        },
      },
      message: 'Interview scheduled successfully',
    };
  }

  async approve(id: string, admin: AuthStaffPayload) {
    const application = await this.prisma.companionApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    if (application.companionId) throw new BadRequestException('Application already approved');

    const passwordHash = await bcrypt.hash(randomUUID(), 12);

    const result = await this.prisma.$transaction(async (tx) => {
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
    const application = await this.prisma.companionApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');

    const updated = await this.prisma.companionApplication.update({
      where: { id },
      data: {
        applicationStatus: 'REJECTED',
        reviewNotes: dto.reason,
        reviewedByStaffId: admin.sub,
      },
    });
    return { data: updated, message: 'Application rejected' };
  }

  async addNote(id: string, dto: AddApplicationNoteDto, admin: AuthStaffPayload) {
    const application = await this.prisma.companionApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');

    const existingNotes = (application.reviewNotes as any) || '';
    const newNote = `[${new Date().toISOString()}] ${admin.name}: ${dto.note}`;
    const combinedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    const updated = await this.prisma.companionApplication.update({
      where: { id },
      data: {
        reviewNotes: combinedNotes,
        reviewedByStaffId: admin.sub,
      },
    });
    return { data: updated, message: 'Note added to application' };
  }
}
