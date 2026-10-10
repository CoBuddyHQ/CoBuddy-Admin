import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateAppLanguageDto } from './dto/master-data.dto';

@Controller('master-data/app-languages')
@Roles(StaffRole.SUPER_ADMIN)
export class AppLanguagesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('appLanguage', query);
    return { data: result.data, meta: result.meta, message: 'App languages fetched' };
  }

  @Post()
  @AuditLog({ action: 'CREATE_APP_LANGUAGE', module: 'masterData', resourceType: 'AppLanguage' })
  async create(@Body() dto: CreateAppLanguageDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('appLanguage', dto);
    return { data: record, message: 'App language created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_APP_LANGUAGE',
    module: 'masterData',
    resourceType: 'AppLanguage',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('appLanguage', id);
    return { data: record, message: 'App language status toggled' };
  }
}
