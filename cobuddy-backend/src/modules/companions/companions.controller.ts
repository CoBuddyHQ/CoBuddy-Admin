import { Controller, Get, Patch, Post, Param, Body, Query, Req } from '@nestjs/common';
import { CompanionsService } from './companions.service';
import { TrustScoreHistoryService } from './services/trust-score-history.service';
import { SessionHistoryService } from './services/session-history.service';
import { EarningsBreakdownService } from './services/earnings-breakdown.service';
import { CompanionQueryDto } from './dto/companion-query.dto';
import { UpdateCompanionStatusDto } from './dto/update-status.dto';
import { UpdateCompanionVerificationDto } from './dto/update-verification.dto';
import { UpdateTrustScoreDto } from './dto/update-trust-score.dto';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';
import { AllowModule, CityScoped, Roles } from '@/common/decorators/auth.decorators';
import { StaffRole } from '@prisma/client';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Controller('companions')
@AllowModule('companions.list')
@CityScoped('cityId', 'companion')
export class CompanionsController {
  constructor(
    private service: CompanionsService,
    private trustScoreHistory: TrustScoreHistoryService,
    private sessionHistory: SessionHistoryService,
    private earningsBreakdown: EarningsBreakdownService,
  ) {}

  @Get()
  findAll(@Query() q: CompanionQueryDto, @Req() req: any) {
    return this.service.findAll(q, req);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(StaffRole.SUPPORT_LEAD, StaffRole.MODERATOR, StaffRole.SUPER_ADMIN)
  @AuditLog({
    action: 'UPDATE_COMPANION_STATUS',
    module: 'companions',
    resourceType: 'Companion',
    resourceIdParam: 'id',
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCompanionStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Patch(':id/verification-status')
  @Roles(StaffRole.MODERATOR, StaffRole.SUPER_ADMIN)
  @AuditLog({
    action: 'UPDATE_COMPANION_VERIFICATION',
    module: 'companions',
    resourceType: 'Companion',
    resourceIdParam: 'id',
  })
  updateVerificationStatus(@Param('id') id: string, @Body() dto: UpdateCompanionVerificationDto) {
    return this.service.updateVerificationStatus(id, dto);
  }

  @Get(':id/trust-score-history')
  getTrustScoreHistory(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.trustScoreHistory.getHistory(id, q);
  }

  @Get(':id/session-history')
  getSessionHistory(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.sessionHistory.getSessionHistory(id, q);
  }

  @Get(':id/earnings-breakdown')
  getEarningsBreakdown(@Param('id') id: string) {
    return this.earningsBreakdown.getEarningsBreakdown(id);
  }

  @Get(':id/payouts')
  getPayouts(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.service.getPayouts(id, q);
  }

  @Get(':id/reviews')
  getReviews(@Param('id') id: string, @Query() q: PaginationQueryDto) {
    return this.service.getReviews(id, q);
  }

  @Get(':id/bank-accounts')
  getBankAccounts(@Param('id') id: string) {
    return this.service.getBankAccounts(id);
  }

  @Post(':id/approve-bank-account/:bankId')
  @Roles(StaffRole.FINANCE_ADMIN, StaffRole.SUPER_ADMIN)
  @AuditLog({
    action: 'APPROVE_BANK_ACCOUNT',
    module: 'companions',
    resourceType: 'BankAccount',
    resourceIdParam: 'bankId',
  })
  approveBankAccount(@Param('id') companionId: string, @Param('bankId') bankId: string) {
    return this.service.approveBankAccount(companionId, bankId);
  }

  @Patch(':id/trust-score')
  @Roles(StaffRole.MODERATOR, StaffRole.SUPER_ADMIN)
  @AuditLog({
    action: 'UPDATE_TRUST_SCORE',
    module: 'companions',
    resourceType: 'Companion',
    resourceIdParam: 'id',
  })
  updateTrustScore(
    @Param('id') id: string,
    @Body() dto: UpdateTrustScoreDto,
    @CurrentUser() user: AuthStaffPayload,
  ) {
    return this.service.updateTrustScore(id, dto, user);
  }
}
