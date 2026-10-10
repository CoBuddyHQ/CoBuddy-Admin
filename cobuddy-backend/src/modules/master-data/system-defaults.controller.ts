import { Controller, Get, Put, Body } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { PrismaService } from '@/prisma/prisma.module';
import { MasterDataService } from './master-data.service';
import { UpdateSystemDefaultsDto } from './dto/master-data.dto';

@Controller('master-data/defaults')
@Roles(StaffRole.SUPER_ADMIN)
export class SystemDefaultsController {
  constructor(
    private prisma: PrismaService,
    private service: MasterDataService,
  ) {}

  @Get()
  async get() {
    let record = await this.prisma.systemDefault.findUnique({
      where: { id: 'singleton' },
    });
    if (!record) {
      record = await this.prisma.systemDefault.create({
        data: { id: 'singleton' },
      });
    }
    return { data: record, message: 'System defaults fetched' };
  }

  @Put()
  @AuditLog({
    action: 'UPDATE_SYSTEM_DEFAULTS',
    module: 'masterData',
    resourceType: 'SystemDefault',
  })
  async update(@Body() dto: UpdateSystemDefaultsDto) {
    this.service.invalidateBundleCache();
    const record = await this.prisma.systemDefault.upsert({
      where: { id: 'singleton' },
      update: dto,
      create: { id: 'singleton', ...dto },
    });
    return { data: record, message: 'System defaults updated' };
  }
}
