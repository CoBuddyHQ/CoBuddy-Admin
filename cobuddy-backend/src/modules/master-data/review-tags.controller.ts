import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateReviewTagDto } from './dto/master-data.dto';

@Controller('master-data/review-tags')
@Roles(StaffRole.SUPER_ADMIN)
export class ReviewTagsController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('reviewTagOption', query);
    return { data: result.data, meta: result.meta, message: 'Review tags fetched' };
  }

  @Post()
  @AuditLog({ action: 'CREATE_REVIEW_TAG', module: 'masterData', resourceType: 'ReviewTagOption' })
  async create(@Body() dto: CreateReviewTagDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('reviewTagOption', dto);
    return { data: record, message: 'Review tag created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_REVIEW_TAG',
    module: 'masterData',
    resourceType: 'ReviewTagOption',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('reviewTagOption', id);
    return { data: record, message: 'Review tag status toggled' };
  }
}
