import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateNotificationCategoryDto } from './dto/master-data.dto';

@Controller('master-data/notification-categories')
@Roles(StaffRole.SUPER_ADMIN)
export class NotificationCategoriesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('notificationCategoryOption', query);
    return { data: result.data, meta: result.meta, message: 'Notification categories fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_NOTIFICATION_CATEGORY',
    module: 'masterData',
    resourceType: 'NotificationCategoryOption',
  })
  async create(@Body() dto: CreateNotificationCategoryDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('notificationCategoryOption', dto);
    return { data: record, message: 'Notification category created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_NOTIFICATION_CATEGORY',
    module: 'masterData',
    resourceType: 'NotificationCategoryOption',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('notificationCategoryOption', id);
    return { data: record, message: 'Notification category status toggled' };
  }
}
