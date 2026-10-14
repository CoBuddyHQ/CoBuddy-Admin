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
    const [appLanguages, placeTypes, ticketCategories, notificationCategories] = await Promise.all([
      this.db.appLanguage.findMany({ where: { active: true } }),
      this.db.placeTypeConfig.findMany(),
      this.db.ticketCategory.findMany({ where: { active: true } }),
      this.db.notificationCategoryOption.findMany({ where: { active: true } }),
    ]);
    return { appLanguages, placeTypes, ticketCategories, notificationCategories };
  }
}
