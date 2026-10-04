import { IsString, IsOptional, Allow } from 'class-validator';

export class CreateAppConfigDto {
  @IsString() configKey: string;
  @Allow() value?: any;
  @IsOptional() @IsString() description?: string;
}
