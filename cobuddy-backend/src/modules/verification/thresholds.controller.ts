import { Controller, Get, Put, Body } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { UpdateThresholdsDto } from './dto/update-thresholds.dto';
import { AllowModule, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser, AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { requireGlobal } from '@/common/auth/city-scope';

@Controller('verification/thresholds')
@AllowModule('verification')
export class ThresholdsController {
  constructor(private service: VerificationService) {}

  @Get()
  get() {
    return this.service.getThresholds();
  }

  @Put()
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.MODERATOR)
  @AuditLog({ action: 'VERIFICATION_THRESHOLDS_UPDATE', module: 'verification', captureDiff: true })
  update(@Body() dto: UpdateThresholdsDto, @CurrentUser() user: AuthStaffPayload) {
    requireGlobal(user);
    return this.service.updateThresholds(dto);
  }
}
