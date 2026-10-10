import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateActivityPaceDto } from './dto/master-data.dto';

@Controller('master-data/activity-paces')
@Roles(StaffRole.SUPER_ADMIN)
export class ActivityPacesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('activityPaceOption', query);
    return { data: result.data, meta: result.meta, message: 'Activity paces fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_ACTIVITY_PACE',
    module: 'masterData',
    resourceType: 'ActivityPaceOption',
  })
  async create(@Body() dto: CreateActivityPaceDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('activityPaceOption', dto);
    return { data: record, message: 'Activity pace created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_ACTIVITY_PACE',
    module: 'masterData',
    resourceType: 'ActivityPaceOption',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('activityPaceOption', id);
    return { data: record, message: 'Activity pace status toggled' };
  }
}
