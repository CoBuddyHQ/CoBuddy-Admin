import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateCommunicationStyleDto } from './dto/master-data.dto';

@Controller('master-data/communication-styles')
@Roles(StaffRole.SUPER_ADMIN)
export class CommunicationStylesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('communicationStyleOption', query);
    return { data: result.data, meta: result.meta, message: 'Communication styles fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_COMMUNICATION_STYLE',
    module: 'masterData',
    resourceType: 'CommunicationStyleOption',
  })
  async create(@Body() dto: CreateCommunicationStyleDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('communicationStyleOption', dto);
    return { data: record, message: 'Communication style created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_COMMUNICATION_STYLE',
    module: 'masterData',
    resourceType: 'CommunicationStyleOption',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('communicationStyleOption', id);
    return { data: record, message: 'Communication style status toggled' };
  }
}
