import { IsOptional, IsString, Allow } from 'class-validator';

export class UpdateAppConfigDto {
  @IsOptional() @Allow() value?: any;
  @IsOptional() @IsString() description?: string;
}
