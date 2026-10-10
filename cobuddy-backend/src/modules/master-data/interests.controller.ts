import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateInterestDto, UpdateInterestMultiplierDto } from './dto/master-data.dto';

@Controller('master-data/interests')
@Roles(StaffRole.SUPER_ADMIN)
export class InterestsController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('interest', query);
    return { data: result.data, meta: result.meta, message: 'Interests fetched' };
  }

  @Post()
  @AuditLog({ action: 'CREATE_INTEREST', module: 'masterData', resourceType: 'Interest' })
  async create(@Body() dto: CreateInterestDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('interest', dto);
    return { data: record, message: 'Interest created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_INTEREST',
    module: 'masterData',
    resourceType: 'Interest',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('interest', id);
    return { data: record, message: 'Interest status toggled' };
  }

  @Patch(':id/multiplier')
  @AuditLog({
    action: 'UPDATE_INTEREST_MULTIPLIER',
    module: 'masterData',
    resourceType: 'Interest',
    resourceIdParam: 'id',
  })
  async updateMultiplier(@Param('id') id: string, @Body() dto: UpdateInterestMultiplierDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.update('interest', id, dto);
    return { data: record, message: 'Interest multiplier updated' };
  }
}
