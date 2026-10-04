import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { Resend } from 'resend';
import { addDuration } from '@/lib/date-util';
import { PrismaService } from '@/prisma/prisma.module';
import { EmployeeStatus, InviteStatus } from '@prisma/client';
import { ERROR_CODES } from '@/common/filters/all-exceptions.filter';
import { AuthStaffPayload } from '@/common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private hashPasswordResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const environment = this.config.get<string>('NODE_ENV') || 'development';

    if (!apiKey) {
      if (environment !== 'production') {
        console.info(`[Password reset] Open this link for ${email}: ${resetUrl}`);
      } else {
        console.error('Password-reset email was requested but RESEND_API_KEY is not configured.');
      }
      return;
    }

    const fromName = this.config.get<string>('EMAIL_FROM_NAME') || 'CoBuddy Admin';
    const fromAddress = this.config.get<string>('EMAIL_FROM_ADDR') || 'no-reply@cobuddy.in';
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: email,
      subject: 'Reset your CoBuddy Admin password',
      text: `A password reset was requested for your CoBuddy Admin account. Reset your password within 1 hour: ${resetUrl}`,
      html: `<p>A password reset was requested for your CoBuddy Admin account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you did not request it, you can ignore this email.</p>`,
    });

    if (error) throw new Error(`Password-reset email delivery failed: ${error.message}`);
  }

  async requestPasswordReset(email: string) {
    const message = 'If an account exists for this email, a password reset link has been sent.';
    const normalizedEmail = email.trim().toLowerCase();
    const emp = await this.prisma.staffEmployee.findUnique({ where: { email: normalizedEmail } });

    if (
      !emp ||
      emp.status !== EmployeeStatus.ACTIVE ||
      emp.inviteStatus !== InviteStatus.ACCEPTED
    ) {
      return { data: { ok: true }, message };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashPasswordResetToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { employeeId: emp.id } }),
      this.prisma.passwordResetToken.create({
        data: { employeeId: emp.id, tokenHash, expiresAt },
      }),
    ]);

    const frontendUrl = (
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await this.sendPasswordResetEmail(emp.email, resetUrl);
    } catch (error) {
      console.error('Password-reset email delivery failed:', error);
    }

    return { data: { ok: true }, message };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashPasswordResetToken(token);
    const passwordHash = await bcrypt.hash(
      password,
      this.config.get<number>('BCRYPT_SALT_ROUNDS') || 12,
    );
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, employeeId: true, expiresAt: true, usedAt: true },
      });

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
        throw new BadRequestException('Invalid or expired password reset link');
      }

      const claim = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claim.count !== 1) {
        throw new BadRequestException('Invalid or expired password reset link');
      }

      await tx.staffEmployee.update({
        where: { id: resetToken.employeeId },
        data: { passwordHash },
      });
      await tx.staffSession.deleteMany({ where: { employeeId: resetToken.employeeId } });
      await tx.passwordResetToken.deleteMany({
        where: { employeeId: resetToken.employeeId, id: { not: resetToken.id } },
      });
    });

    return {
      data: { ok: true },
      message: 'Password updated. Please sign in with your new password.',
    };
  }

  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const emp = await this.prisma.staffEmployee.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!emp) throw new UnauthorizedException('Invalid credentials');
    if (emp.status === EmployeeStatus.SUSPENDED) {
      const err: any = new ForbiddenException('Account suspended');
      err.code = ERROR_CODES.ACCOUNT_SUSPENDED;
      throw err;
    }
    if (emp.inviteStatus !== InviteStatus.ACCEPTED) {
      throw new ForbiddenException('Invite not accepted yet');
    }
    const ok = await bcrypt.compare(password, emp.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (emp.twoFactorEnabled) {
      const mfaToken = this.jwt.sign(
        { sub: emp.id, stage: 'mfa-required' },
        { secret: this.config.getOrThrow('JWT_MFA_SECRET'), expiresIn: '5m' },
      );
      const err: any = new UnauthorizedException('2FA required');
      err.code = ERROR_CODES.TWO_FACTOR_REQUIRED;
      err.details = { requires2fa: true, mfaToken };
      throw err;
    }

    return this.finalizeLogin(emp, ip, userAgent);
  }

  async verify2FA(mfaToken: string, otp: string, ip?: string, userAgent?: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(mfaToken, { secret: this.config.getOrThrow('JWT_MFA_SECRET') });
    } catch {
      throw new UnauthorizedException('Expired or invalid mfaToken');
    }
    if (payload.stage !== 'mfa-required' || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid mfaToken');
    }
    const emp = await this.prisma.staffEmployee.findUnique({ where: { id: payload.sub } });
    if (
      !emp ||
      emp.status !== EmployeeStatus.ACTIVE ||
      emp.inviteStatus !== InviteStatus.ACCEPTED
    ) {
      throw new UnauthorizedException('Account inactive');
    }
    if (!emp.twoFactorEnabled || !emp.twoFactorSecret)
      throw new BadRequestException('2FA not enabled');
    const valid = authenticator.check(otp, emp.twoFactorSecret);
    if (!valid) throw new UnauthorizedException('Invalid OTP');
    return this.finalizeLogin(emp, ip, userAgent);
  }

  async finalizeLogin(emp: any, ip?: string, userAgent?: string) {
    if (emp.status !== EmployeeStatus.ACTIVE || emp.inviteStatus !== InviteStatus.ACCEPTED) {
      throw new UnauthorizedException('Account inactive');
    }
    const refreshTtl = this.config.get('JWT_REFRESH_TTL') || '7d';
    const accessExpires = addDuration(this.config.get('JWT_ACCESS_TTL') || '15m');
    const refreshExpires = addDuration(refreshTtl);

    const sessionId = randomUUID();
    const access = this.jwt.sign({
      sub: emp.id,
      sid: sessionId,
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      roles: emp.roles,
      cityScopeIds: emp.cityScopeIds || [],
      department: emp.department,
    });

    const refresh = randomUUID();
    await this.prisma.staffSession.create({
      data: {
        id: sessionId,
        employeeId: emp.id,
        refreshToken: refresh,
        expiresAt: refreshExpires,
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
    });
    await this.prisma.staffEmployee.update({
      where: { id: emp.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip || null },
    });

    return {
      data: {
        accessToken: access,
        accessExpiresAt: accessExpires,
        refreshToken: refresh,
        refreshExpiresAt: refreshExpires,
        profile: {
          id: emp.id,
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          roles: emp.roles,
          cityScope: emp.cityScopeIds,
          department: emp.department,
          designation: emp.designation,
          twoFactorEnabled: emp.twoFactorEnabled,
          lastLoginAt: emp.lastLoginAt,
        },
      },
      message: 'Login successful',
    };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.staffSession.findUnique({ where: { refreshToken } });
    if (!session) throw new UnauthorizedException('Invalid refresh token');
    if (session.expiresAt <= new Date()) {
      await this.prisma.staffSession.deleteMany({ where: { refreshToken } });
      throw new UnauthorizedException('Refresh token expired');
    }
    const emp = await this.prisma.staffEmployee.findUnique({ where: { id: session.employeeId } });
    if (!emp || emp.status !== EmployeeStatus.ACTIVE || emp.inviteStatus !== InviteStatus.ACCEPTED)
      throw new UnauthorizedException('Account inactive');

    const newRefresh = randomUUID();
    const refreshExpiresAt = addDuration(this.config.get('JWT_REFRESH_TTL') || '7d');
    const rotated = await this.prisma.staffSession.updateMany({
      where: { id: session.id, refreshToken, expiresAt: { gt: new Date() } },
      data: { refreshToken: newRefresh, expiresAt: refreshExpiresAt },
    });
    if (rotated.count !== 1)
      throw new UnauthorizedException('Refresh token already used or revoked');

    const access = this.jwt.sign({
      sub: emp.id,
      sid: session.id,
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      roles: emp.roles,
      cityScopeIds: emp.cityScopeIds || [],
      department: emp.department,
    });
    return {
      data: {
        accessToken: access,
        accessExpiresAt: addDuration(this.config.get('JWT_ACCESS_TTL') || '15m'),
        refreshToken: newRefresh,
        refreshExpiresAt,
      },
    };
  }

  async logout(user: AuthStaffPayload, _refreshToken?: string) {
    if (!user.sessionId) throw new UnauthorizedException('Missing session');
    await this.prisma.staffSession.deleteMany({
      where: { id: user.sessionId, employeeId: user.sub },
    });
    return { data: { ok: true }, message: 'Logged out' };
  }

  async logoutAll(user: AuthStaffPayload) {
    const count = await this.prisma.staffSession.deleteMany({ where: { employeeId: user.sub } });
    return { data: { sessionsRemoved: count.count }, message: 'All sessions revoked' };
  }

  async setup2FA(user: AuthStaffPayload) {
    const emp = await this.prisma.staffEmployee.findUnique({ where: { id: user.sub } });
    if (!emp) throw new BadRequestException('Employee not found');
    if (emp.twoFactorEnabled)
      throw new BadRequestException('Disable existing 2FA before setting it up again');
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(emp.email, 'CoBuddy Admin', secret);
    const dataUrl = await qrcode.toDataURL(otpauth);
    const setup = await this.prisma.staffEmployee.updateMany({
      where: { id: user.sub, twoFactorEnabled: false },
      data: { twoFactorSecret: secret },
    });
    if (setup.count !== 1) throw new BadRequestException('2FA is already enabled');
    return { data: { otpauthUrl: otpauth, qrcodeDataUrl: dataUrl } };
  }

  async confirm2FA(user: AuthStaffPayload, otp: string) {
    const emp = await this.prisma.staffEmployee.findUnique({ where: { id: user.sub } });
    if (!emp || !emp.twoFactorSecret) throw new BadRequestException('2FA not initiated');
    const ok = authenticator.check(otp, emp.twoFactorSecret);
    if (!ok) throw new BadRequestException('Invalid OTP');
    await this.prisma.staffEmployee.update({
      where: { id: user.sub },
      data: { twoFactorEnabled: true },
    });
    return { message: '2FA enabled' };
  }

  async remove2FA(user: AuthStaffPayload, password: string) {
    const emp = await this.prisma.staffEmployee.findUnique({ where: { id: user.sub } });
    if (!emp) throw new BadRequestException('No employee');
    const ok = await bcrypt.compare(password, emp.passwordHash);
    if (!ok) throw new BadRequestException('Wrong password');
    await this.prisma.staffEmployee.update({
      where: { id: user.sub },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { message: '2FA disabled' };
  }

  async me(user: AuthStaffPayload) {
    const emp = await this.prisma.staffEmployee.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        roles: true,
        cityScopeIds: true,
        status: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!emp) throw new InternalServerErrorException('Employee missing');
    return { data: emp };
  }
}
