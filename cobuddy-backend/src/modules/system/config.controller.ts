import { Controller, Get, Put, Body } from '@nestjs/common';
import { ConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('system/config')
@AllowModule('system.configs')
export class ConfigController {
  constructor(private service: ConfigService) {}

  @Get()
  getConfig() {
    return this.service.getConfig();
  }

  @Put()
  @AuditLog({
    action: 'UPDATE_SYSTEM_CONFIG',
    module: 'system.configs',
    resourceType: 'SystemDefault',
    captureDiff: true,
  })
  updateConfig(@Body() dto: UpdateConfigDto) {
    return this.service.updateConfig(dto);
  }
}
