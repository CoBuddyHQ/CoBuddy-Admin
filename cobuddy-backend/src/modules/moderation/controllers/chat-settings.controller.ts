import { Controller, Get, Put, Body } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { UpdateChatSettingsDto } from '../dto/chat-settings.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('moderation/chat-settings')
@AllowModule('chat-settings')
export class ChatSettingsController {
  constructor(private service: ModerationService) {}

  @Get()
  get() {
    return this.service.getChatSettings();
  }

  @Put()
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'CHAT_SETTINGS_UPDATE', module: 'moderation', captureDiff: true })
  update(@Body() dto: UpdateChatSettingsDto) {
    return this.service.updateChatSettings(dto);
  }
}
