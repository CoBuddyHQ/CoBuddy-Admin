import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreatePlaceTypeDto, UpdatePlaceTypeDto } from './dto/master-data.dto';

@Controller('master-data/place-types')
@Roles(StaffRole.SUPER_ADMIN)
export class PlaceTypesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('placeTypeConfig', query);
    return { data: result.data, meta: result.meta, message: 'Place types fetched' };
  }

  @Post()
  @AuditLog({ action: 'CREATE_PLACE_TYPE', module: 'masterData', resourceType: 'PlaceTypeConfig' })
  async create(@Body() dto: CreatePlaceTypeDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('placeTypeConfig', dto);
    return { data: record, message: 'Place type created' };
  }

  @Patch(':id')
  @AuditLog({
    action: 'UPDATE_PLACE_TYPE',
    module: 'masterData',
    resourceType: 'PlaceTypeConfig',
    resourceIdParam: 'id',
  })
  async update(@Param('id') id: string, @Body() dto: UpdatePlaceTypeDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.update('placeTypeConfig', id, dto);
    return { data: record, message: 'Place type updated' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_PLACE_TYPE',
    module: 'masterData',
    resourceType: 'PlaceTypeConfig',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('placeTypeConfig', id, 'isAllowed');
    return { data: record, message: 'Place type status toggled' };
  }
}
