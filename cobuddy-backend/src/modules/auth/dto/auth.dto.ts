import {
  IsEmail,
  IsString,
  IsNumberString,
  IsOptional,
  Length,
  MinLength,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) @MaxLength(64) password: string;
}

export class Verify2FADto {
  @IsString() mfaToken: string;
  @IsNumberString() @Length(6, 6) otp: string;
}

export class RefreshDto {
  @IsString() refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail() email: string;
}

export class ResetPasswordDto {
  @IsString() @MinLength(32) @MaxLength(128) token: string;
  @IsString() @MinLength(8) @MaxLength(64) password: string;
}

export class LogoutDto {
  @IsOptional() @IsString() refreshToken?: string;
}

export class Confirm2FADto {
  @IsNumberString() @Length(6, 6) otp: string;
}

export class Remove2FADto {
  @IsString() @MinLength(6) @MaxLength(64) password: string;
}

export class Setup2FAResponseDto {
  otpauthUrl: string;
  qrcodeDataUrl: string;
}
