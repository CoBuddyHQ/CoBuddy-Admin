import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { ListFlaggedChatsDto, DecideFlaggedChatDto } from '../dto/flagged-chats.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('moderation/flagged-chats')
@AllowModule('flagged-chats')
export class FlaggedChatsController {
  constructor(private service: ModerationService) {}

  @Get()
  list(@Query() dto: ListFlaggedChatsDto) {
    return this.service.listFlaggedChats(dto);
  }

  @Get(':chatId')
  get(@Param('chatId') chatId: string) {
    return this.service.getFlaggedChat(chatId);
  }

  @Post(':chatId/decide')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'FLAGGED_CHAT_DECIDE', module: 'moderation', resourceIdParam: 'chatId' })
  decide(
    @Param('chatId') chatId: string,
    @Body() dto: DecideFlaggedChatDto,
    @CurrentUser() u: AuthStaffPayload,
  ) {
    return this.service.decideFlaggedChat(chatId, dto, u);
  }
}
