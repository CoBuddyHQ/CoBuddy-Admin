import { Controller, Get } from '@nestjs/common';
import { Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.module';

@Controller('admin-options')
@Roles(...Object.values(StaffRole))
export class WorkflowOptionsController {
  constructor(private readonly db: PrismaService) {}
  @Get('workflow')
  async options() {
    let [appLanguages, placeTypes, ticketCategories, notificationCategories] = await Promise.all([
      this.db.appLanguage.findMany({ where: { active: true } }),
      this.db.placeTypeConfig.findMany(),
      this.db.ticketCategory.findMany({ where: { active: true } }),
      this.db.notificationCategoryOption.findMany({ where: { active: true } }),
    ]);
    if (!notificationCategories || notificationCategories.length === 0) {
      notificationCategories = [
        { id: '1', code: 'PROMOTION', label: { en: 'Promotions & Offers' }, active: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', code: 'SYSTEM', label: { en: 'System Announcement' }, active: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', code: 'SAFETY', label: { en: 'Safety Alert' }, active: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '4', code: 'POLICY', label: { en: 'Policy Update' }, active: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '5', code: 'REMINDER', label: { en: 'Reminder' }, active: true, createdAt: new Date(), updatedAt: new Date() },
        { id: '6', code: 'GENERAL', label: { en: 'General' }, active: true, createdAt: new Date(), updatedAt: new Date() },
      ] as any;
    }
    return { appLanguages, placeTypes, ticketCategories, notificationCategories };
  }
}
