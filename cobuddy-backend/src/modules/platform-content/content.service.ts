import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.module';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { LessonInput, PolicyInput } from '@/common/validation/workflow-inputs';
import { requireGlobal } from '@/common/auth/city-scope';

@Injectable()
export class ContentService {
  constructor(private readonly db: PrismaService) {}
  async policies() {
    return (
      await this.db.policyDocument.findMany({
        include: { _count: { select: { consents: true } } },
        orderBy: { createdAt: 'desc' },
      })
    ).map((p) => ({
      id: p.id,
      type: p.docKey,
      title: p.titleI18n ?? { en: p.title },
      content: p.contentI18n ?? { en: p.content },
      version: p.version,
      publishStatus: p.publishStatus,
      lastUpdated: p.updatedAt,
      consentCount: p._count.consents,
    }));
  }
  async createPolicy(input: PolicyInput, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.type}))`;
      const versions = await tx.policyDocument.findMany({
        where: { docKey: input.type },
        select: { version: true },
      });
      const latest = versions.reduce(
        (max, row) => Math.max(max, Number.parseInt(row.version, 10) || 0),
        0,
      );
      return tx.policyDocument.create({
        data: {
          docKey: input.type,
          version: `${latest + 1}.0`,
          title: input.title.en,
          content: input.content.en,
          titleI18n: input.title,
          contentI18n: input.content,
          effectiveOn: new Date(),
        },
      });
    });
  }
  async policyStatus(id: string, status: string, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.$transaction(
      async (tx) => {
        const policy = await tx.policyDocument.findUniqueOrThrow({ where: { id } });
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${policy.docKey}))`;
        if (policy.publishStatus !== 'DRAFT' && status === 'DRAFT')
          throw new ConflictException('Published versions are immutable. Create a new version.');
        if (status === 'PUBLISHED') {
          if (!policy.content.trim())
            throw new ConflictException('Add document content before publication');
          await tx.policyDocument.updateMany({
            where: { docKey: policy.docKey, publishStatus: 'PUBLISHED', id: { not: id } },
            data: { publishStatus: 'ARCHIVED' },
          });
        }
        return tx.policyDocument.update({
          where: { id },
          data: {
            publishStatus: status,
            ...(status === 'PUBLISHED' ? { publishedBy: user.sub, effectiveOn: new Date() } : {}),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  async updatePolicy(id: string, input: PolicyInput, user: AuthStaffPayload) {
    requireGlobal(user);
    const result = await this.db.policyDocument.updateMany({
      where: { id, docKey: input.type, publishStatus: 'DRAFT' },
      data: {
        title: input.title.en,
        content: input.content.en,
        titleI18n: input.title,
        contentI18n: input.content,
      },
    });
    if (!result.count)
      throw new ConflictException(
        'Only a draft of the same document type can be edited. Create a new version for published content.',
      );
    return { id };
  }
  async deletePolicy(id: string, user: AuthStaffPayload) {
    requireGlobal(user);
    const result = await this.db.policyDocument.deleteMany({
      where: { id, publishStatus: 'DRAFT', consents: { none: {} } },
    });
    if (!result.count) throw new ConflictException('Only drafts without consents can be deleted');
    return { id };
  }
  async consents() {
    return (
      await this.db.policyConsent.findMany({
        include: { document: { select: { docKey: true, version: true } } },
        orderBy: { createdAt: 'desc' },
      })
    ).map((c) => ({
      id: c.id,
      userId: c.userId,
      documentType: c.document.docKey,
      documentVersion: c.document.version,
      timestamp: c.createdAt,
      ipAddress: c.ipAddress,
    }));
  }
  async lessons() {
    return (
      await this.db.trainingModule.findMany({
        include: { _count: { select: { completions: { where: { passed: true } } } } },
        orderBy: { createdAt: 'desc' },
      })
    ).map((t) => ({
      id: t.id,
      title: t.titleI18n ?? { en: t.title },
      content: t.contentI18n ?? {},
      category: t.category,
      status: t.publishStatus,
      completionCount: t._count.completions,
      lastUpdated: t.updatedAt,
    }));
  }
  async createLesson(input: LessonInput, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.trainingModule.create({
      data: {
        title: input.title.en,
        titleI18n: input.title,
        contentI18n: input.content,
        category: input.category,
        audience: 'COMPANIONS',
        contentUrl: '',
        active: false,
      },
    });
  }
  async lessonStatus(id: string, status: string, user: AuthStaffPayload) {
    requireGlobal(user);
    return this.db.trainingModule.update({
      where: { id },
      data: { publishStatus: status, active: status === 'PUBLISHED' },
    });
  }
  async updateLesson(id: string, input: LessonInput, user: AuthStaffPayload) {
    requireGlobal(user);
    const result = await this.db.trainingModule.updateMany({
      where: { id, publishStatus: 'DRAFT', completions: { none: {} } },
      data: {
        title: input.title.en,
        titleI18n: input.title,
        contentI18n: input.content,
        category: input.category,
      },
    });
    if (!result.count)
      throw new ConflictException(
        'Only drafts without completion history can be edited. Create a new lesson to replace published material.',
      );
    return { id };
  }
  async deleteLesson(id: string, user: AuthStaffPayload) {
    requireGlobal(user);
    const module = await this.db.trainingModule.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { completions: true } } },
    });
    if (module.publishStatus === 'PUBLISHED' || module._count.completions)
      throw new ConflictException('Only drafts without completion history can be deleted');
    await this.db.trainingModule.delete({ where: { id } });
    return { id };
  }
  async quiz() {
    const modules = await this.db.trainingModule.findMany({
      where: { category: 'SAFETY', active: true },
      select: { passPctReq: true, quizJson: true },
    });
    const completions = await this.db.trainingCompletion.findMany({
      where: { passed: true, userType: 'COMPANION', module: { category: 'SAFETY', active: true } },
      distinct: ['userId'],
      select: { userId: true },
    });
    const activeCompanionsPassed = await this.db.companion.count({
      where: { id: { in: completions.map((c) => c.userId) }, status: 'ACTIVE' },
    });
    return {
      passCriteriaPercentage: modules.length ? Math.max(...modules.map((m) => m.passPctReq)) : null,
      totalQuestions: modules.reduce(
        (sum, m) => sum + (Array.isArray(m.quizJson) ? m.quizJson.length : 0),
        0,
      ),
      activeCompanionsPassed,
    };
  }
}
