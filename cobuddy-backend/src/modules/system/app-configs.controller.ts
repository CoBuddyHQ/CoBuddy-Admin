import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AppConfigsService } from './app-configs.service';
import { CreateAppConfigDto } from './dto/create-app-config.dto';
import { UpdateAppConfigDto } from './dto/update-app-config.dto';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('system/app-configs')
@AllowModule('system.configs')
export class AppConfigsController {
  constructor(private service: AppConfigsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('key/:configKey')
  findByKey(@Param('configKey') configKey: string) {
    return this.service.findByKey(configKey);
  }

  @Put('key/:configKey')
  @AuditLog({
    action: 'UPSERT_APP_CONFIG',
    module: 'system.configs',
    resourceType: 'AppConfig',
    resourceIdParam: 'configKey',
    captureDiff: true,
  })
  upsertByKey(@Param('configKey') configKey: string, @Body() dto: UpdateAppConfigDto) {
    return this.service.upsertByKey(configKey, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @AuditLog({
    action: 'CREATE_APP_CONFIG',
    module: 'system.configs',
    resourceType: 'AppConfig',
    captureDiff: true,
  })
  create(@Body() dto: CreateAppConfigDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @AuditLog({
    action: 'UPDATE_APP_CONFIG',
    module: 'system.configs',
    resourceType: 'AppConfig',
    resourceIdParam: 'id',
    captureDiff: true,
  })
  update(@Param('id') id: string, @Body() dto: UpdateAppConfigDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @AuditLog({
    action: 'DELETE_APP_CONFIG',
    module: 'system.configs',
    resourceType: 'AppConfig',
    resourceIdParam: 'id',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
