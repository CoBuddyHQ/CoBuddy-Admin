import { IsOptional, IsBoolean, IsInt, IsString, Min, Max } from 'class-validator';

export class UpdateChatSettingsDto {
  @IsOptional() @IsBoolean() enableProfanityFilter?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100) profanitySeverityThreshold?: number;
  @IsOptional() @IsBoolean() enableLinkWhitelist?: boolean;
  @IsOptional() @IsBoolean() enableAutoFlagging?: boolean;
  @IsOptional() @IsInt() @Min(1) maxMessageLength?: number;
  @IsOptional() @IsString() allowedMediaTypes?: string;
}
