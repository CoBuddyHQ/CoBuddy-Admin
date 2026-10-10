import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateIncidentTypeDto } from './dto/master-data.dto';

@Controller('master-data/incident-types')
@Roles(StaffRole.SUPER_ADMIN)
export class IncidentTypesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('incidentType', query);
    return { data: result.data, meta: result.meta, message: 'Incident types fetched' };
  }

  @Post()
  @AuditLog({ action: 'CREATE_INCIDENT_TYPE', module: 'masterData', resourceType: 'IncidentType' })
  async create(@Body() dto: CreateIncidentTypeDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('incidentType', dto);
    return { data: record, message: 'Incident type created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_INCIDENT_TYPE',
    module: 'masterData',
    resourceType: 'IncidentType',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('incidentType', id);
    return { data: record, message: 'Incident type status toggled' };
  }
}
