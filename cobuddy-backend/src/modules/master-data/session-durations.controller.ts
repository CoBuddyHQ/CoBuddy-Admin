import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateSessionDurationDto } from './dto/master-data.dto';

@Controller('master-data/session-durations')
@Roles(StaffRole.SUPER_ADMIN)
export class SessionDurationsController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('sessionDurationOption', query);
    return { data: result.data, meta: result.meta, message: 'Session durations fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_SESSION_DURATION',
    module: 'masterData',
    resourceType: 'SessionDurationOption',
  })
  async create(@Body() dto: CreateSessionDurationDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('sessionDurationOption', dto);
    return { data: record, message: 'Session duration created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_SESSION_DURATION',
    module: 'masterData',
    resourceType: 'SessionDurationOption',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('sessionDurationOption', id);
    return { data: record, message: 'Session duration status toggled' };
  }
}
