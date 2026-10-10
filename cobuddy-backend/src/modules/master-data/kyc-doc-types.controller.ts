import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { FilterQueryDto } from '@/common/dto/pagination.dto';
import { MasterDataService } from './master-data.service';
import { CreateKycDocTypeDto } from './dto/master-data.dto';

@Controller('master-data/kyc-doc-types')
@Roles(StaffRole.SUPER_ADMIN)
export class KycDocTypesController {
  constructor(private service: MasterDataService) {}

  @Get()
  async findAll(@Query() query: FilterQueryDto) {
    const result = await this.service.findAllPaginated('kycDocumentType', query);
    return { data: result.data, meta: result.meta, message: 'KYC document types fetched' };
  }

  @Post()
  @AuditLog({
    action: 'CREATE_KYC_DOC_TYPE',
    module: 'masterData',
    resourceType: 'KYCDocumentType',
  })
  async create(@Body() dto: CreateKycDocTypeDto) {
    this.service.invalidateBundleCache();
    const record = await this.service.create('kycDocumentType', dto);
    return { data: record, message: 'KYC document type created' };
  }

  @Patch(':id/toggle')
  @AuditLog({
    action: 'TOGGLE_KYC_DOC_TYPE',
    module: 'masterData',
    resourceType: 'KYCDocumentType',
    resourceIdParam: 'id',
  })
  async toggle(@Param('id') id: string) {
    this.service.invalidateBundleCache();
    const record = await this.service.toggleActive('kycDocumentType', id);
    return { data: record, message: 'KYC document type status toggled' };
  }
}
