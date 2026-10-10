import { Body, Controller, Get, Post, Delete, Ip, Headers, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  Verify2FADto,
  RefreshDto,
  LogoutDto,
  Confirm2FADto,
  Remove2FADto,
} from './dto/auth.dto';
import { Public, CurrentUser } from '@/common/decorators/auth.decorators';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @AuditLog({ action: 'LOGIN_ATTEMPT', module: 'auth', resourceType: 'StaffEmployee' })
  async login(@Body() b: LoginDto, @Ip() ip: string, @Headers('user-agent') ua: string) {
    return this.service.login(b.email, b.password, ip, ua);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  async forgotPassword(@Body() b: ForgotPasswordDto) {
    return this.service.requestPasswordReset(b.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async resetPassword(@Body() b: ResetPasswordDto) {
    return this.service.resetPassword(b.token, b.password);
  }

  @Public()
  @Post('verify-2fa')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @AuditLog({ action: 'VERIFY_2FA', module: 'auth' })
  async verify2fa(@Body() b: Verify2FADto, @Ip() ip: string, @Headers('user-agent') ua: string) {
    return this.service.verify2FA(b.mfaToken, b.otp, ip, ua);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() b: RefreshDto) {
    return this.service.refresh(b.refreshToken);
  }

  @Post('logout')
  @AuditLog({ action: 'LOGOUT', module: 'auth' })
  async logout(@CurrentUser() u: AuthStaffPayload, @Body() b: LogoutDto) {
    return this.service.logout(u, b?.refreshToken);
  }

  @Delete('sessions')
  @AuditLog({ action: 'REVOKE_ALL_SESSIONS', module: 'auth' })
  async logoutAll(@CurrentUser() u: AuthStaffPayload) {
    return this.service.logoutAll(u);
  }

  @Get('me')
  me(@CurrentUser() u: AuthStaffPayload) {
    return this.service.me(u);
  }

  @Post('2fa/setup')
  setup2FA(@CurrentUser() u: AuthStaffPayload) {
    return this.service.setup2FA(u);
  }

  @Post('2fa/confirm')
  @HttpCode(200)
  confirm2FA(@CurrentUser() u: AuthStaffPayload, @Body() b: Confirm2FADto) {
    return this.service.confirm2FA(u, b.otp);
  }

  @Post('2fa/remove')
  @AuditLog({ action: 'DISABLE_2FA', module: 'auth' })
  remove2FA(@CurrentUser() u: AuthStaffPayload, @Body() b: Remove2FADto) {
    return this.service.remove2FA(u, b.password);
  }
}
