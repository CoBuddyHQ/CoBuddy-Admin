import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateSpokenLanguageDto } from './dto/master-data.dto';

@Controller('master-data/languages')
@Roles(StaffRole.SUPER_ADMIN)
export class LanguagesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('spokenLanguage', query);
    return { data: result.data, meta: result.meta, message: 'Spoken languages fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_SPOKEN_LANGUAGE',
    module: 'masterData',
    resourceType: 'SpokenLanguage',
  })
  async create(@Body() dto: CreateSpokenLanguageDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('spokenLanguage', dto);
    return { data: record, message: 'Spoken language created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_SPOKEN_LANGUAGE',
    module: 'masterData',
    resourceType: 'SpokenLanguage',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('spokenLanguage', id);
    return { data: record, message: 'Spoken language status toggled' };
  }
}
