import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.module';
import { FilterQueryDto } from '@/common/dto/pagination.dto';

type PrismaModelName =
  | 'city'
  | 'area'
  | 'interest'
  | 'spokenLanguage'
  | 'appLanguage'
  | 'ticketCategory'
  | 'incidentType'
  | 'communicationStyleOption'
  | 'activityPaceOption'
  | 'sessionDurationOption'
  | 'notificationCategoryOption'
  | 'reviewTagOption'
  | 'disputeReason'
  | 'cancellationReason'
  | 'kycDocumentType'
  | 'placeTypeConfig';

@Injectable()
export class MasterDataService {
  private bundleCache: { data: any; expiresAt: number } | null = null;
  private readonly BUNDLE_TTL = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async findAllPaginated(modelName: PrismaModelName, query: FilterQueryDto, include?: any) {
    const { page, pageSize, search, sortBy, sortOrder, status } = query;
    const where: any = {};
    const model = this.getModel(modelName);

    if (search) {
      const nameFields = this.getNameFields(modelName);
      if (nameFields.length > 0) {
        where.OR = nameFields.map((f) => ({
          [f]: { contains: search, mode: 'insensitive' },
        }));
      }
    }

    if (status !== undefined && this.hasActiveField(modelName)) {
      where.active = status === 'active' ? true : status === 'inactive' ? false : undefined;
      if (where.active === undefined) delete where.active;
    }

    const orderBy: any = {};
    const validSortFields = this.getValidSortFields(modelName);
    orderBy[validSortFields.includes(sortBy || '') ? sortBy! : 'createdAt'] = sortOrder || 'desc';

    const [totalItems, items] = await Promise.all([
      (model as any).count({ where }),
      (model as any).findMany({
        where,
        include,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      data: items,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findAllActive(
    modelName: PrismaModelName,
    include?: any,
    orderBy: any = { createdAt: 'desc' },
  ) {
    const model = this.getModel(modelName);
    const where: any = {};
    if (this.hasActiveField(modelName)) {
      where.active = true;
    } else if (modelName === 'placeTypeConfig') {
      where.isAllowed = true;
    }
    return (model as any).findMany({ where, include, orderBy });
  }

  async findById(modelName: PrismaModelName, id: string, include?: any) {
    const model = this.getModel(modelName);
    const record = await (model as any).findUnique({ where: { id }, include });
    if (!record) {
      throw new NotFoundException(`${this.modelLabel(modelName)} not found`);
    }
    return record;
  }

  async create(modelName: PrismaModelName, data: any) {
    const model = this.getModel(modelName);
    return (model as any).create({ data });
  }

  async update(modelName: PrismaModelName, id: string, data: any) {
    await this.findById(modelName, id);
    const model = this.getModel(modelName);
    return (model as any).update({ where: { id }, data });
  }

  async toggleActive(
    modelName: PrismaModelName,
    id: string,
    field: 'active' | 'isAllowed' = 'active',
  ) {
    const record = await this.findById(modelName, id);
    const model = this.getModel(modelName);
    return (model as any).update({
      where: { id },
      data: { [field]: !record[field] } as any,
    });
  }

  async delete(modelName: PrismaModelName, id: string) {
    await this.findById(modelName, id);
    const model = this.getModel(modelName);
    return (model as any).delete({ where: { id } });
  }

  private getModel(modelName: PrismaModelName) {
    const map: Record<PrismaModelName, any> = {
      city: this.prisma.city,
      area: this.prisma.area,
      interest: this.prisma.interest,
      spokenLanguage: this.prisma.spokenLanguage,
      appLanguage: this.prisma.appLanguage,
      ticketCategory: this.prisma.ticketCategory,
      incidentType: this.prisma.incidentType,
      communicationStyleOption: this.prisma.communicationStyleOption,
      activityPaceOption: this.prisma.activityPaceOption,
      sessionDurationOption: this.prisma.sessionDurationOption,
      notificationCategoryOption: this.prisma.notificationCategoryOption,
      reviewTagOption: this.prisma.reviewTagOption,
      disputeReason: this.prisma.disputeReason,
      cancellationReason: this.prisma.cancellationReason,
      kycDocumentType: this.prisma.kYCDocumentType,
      placeTypeConfig: this.prisma.placeTypeConfig,
    };
    return map[modelName];
  }

  private getNameFields(modelName: PrismaModelName): string[] {
    const map: Partial<Record<PrismaModelName, string[]>> = {
      city: ['cityCode'],
      area: [],
      interest: [],
      spokenLanguage: ['code', 'name'],
      appLanguage: ['code', 'name'],
      ticketCategory: ['code'],
      incidentType: ['code'],
      communicationStyleOption: ['code'],
      activityPaceOption: ['code'],
      sessionDurationOption: [],
      notificationCategoryOption: ['code'],
      reviewTagOption: ['code'],
      disputeReason: ['code'],
      cancellationReason: ['code'],
      kycDocumentType: ['code'],
      placeTypeConfig: ['typeName'],
    };
    return map[modelName] || [];
  }

  private hasActiveField(modelName: PrismaModelName): boolean {
    return modelName !== 'placeTypeConfig';
  }

  private getValidSortFields(modelName: PrismaModelName): string[] {
    const base = ['createdAt', 'updatedAt'];
    const extra: Partial<Record<PrismaModelName, string[]>> = {
      city: ['cityCode', 'state', 'country'],
      area: [],
      interest: ['type'],
      spokenLanguage: ['code', 'name'],
      appLanguage: ['code', 'name'],
      ticketCategory: ['code'],
      incidentType: ['code'],
      communicationStyleOption: ['code'],
      activityPaceOption: ['code'],
      sessionDurationOption: ['minutes'],
      notificationCategoryOption: ['code'],
      reviewTagOption: ['code', 'polarity', 'appliesTo'],
      disputeReason: ['code'],
      cancellationReason: ['code', 'appliesTo'],
      kycDocumentType: ['code'],
      placeTypeConfig: ['typeName'],
    };
    return [...base, ...(extra[modelName] || [])];
  }

  private modelLabel(modelName: PrismaModelName): string {
    const labels: Record<PrismaModelName, string> = {
      city: 'City',
      area: 'Area',
      interest: 'Interest',
      spokenLanguage: 'Spoken Language',
      appLanguage: 'App Language',
      ticketCategory: 'Ticket Category',
      incidentType: 'Incident Type',
      communicationStyleOption: 'Communication Style',
      activityPaceOption: 'Activity Pace',
      sessionDurationOption: 'Session Duration',
      notificationCategoryOption: 'Notification Category',
      reviewTagOption: 'Review Tag',
      disputeReason: 'Dispute Reason',
      cancellationReason: 'Cancellation Reason',
      kycDocumentType: 'KYC Document Type',
      placeTypeConfig: 'Place Type',
    };
    return labels[modelName];
  }

  async getBundle() {
    const now = Date.now();
    if (this.bundleCache && this.bundleCache.expiresAt > now) {
      return this.bundleCache.data;
    }

    const [
      cities,
      areas,
      interests,
      languages,
      ticketCategories,
      incidentTypes,
      reviewTags,
      disputeReasons,
      cancellationReasons,
      placeTypes,
      sessionDurations,
      defaults,
    ] = await Promise.all([
      this.findAllActive('city'),
      this.prisma.area.findMany({ where: { active: true } }),
      this.findAllActive('interest'),
      this.findAllActive('spokenLanguage'),
      this.findAllActive('ticketCategory'),
      this.findAllActive('incidentType'),
      this.findAllActive('reviewTagOption'),
      this.findAllActive('disputeReason'),
      this.findAllActive('cancellationReason'),
      this.prisma.placeTypeConfig.findMany({ where: { isAllowed: true } }),
      this.findAllActive('sessionDurationOption'),
      this.prisma.systemDefault.findUnique({ where: { id: 'singleton' } }),
    ]);

    const data = {
      cities,
      areas,
      interests,
      languages,
      ticketCategories,
      incidentTypes,
      reviewTags,
      disputeReasons,
      cancellationReasons,
      placeTypes,
      sessionDurations,
      defaults,
    };

    this.bundleCache = { data, expiresAt: now + this.BUNDLE_TTL };
    return data;
  }

  invalidateBundleCache() {
    this.bundleCache = null;
  }
}
