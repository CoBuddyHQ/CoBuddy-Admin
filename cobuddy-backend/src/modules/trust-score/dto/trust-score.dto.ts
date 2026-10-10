import { IsString, IsInt, IsOptional, IsBoolean, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateRuleDto {
  @IsString() @IsNotEmpty() trigger: string;

  @IsInt() @Min(-100) @Max(100) delta: number;

  @IsString() @IsNotEmpty() category: string;

  @IsOptional() @IsString() description?: string;
}

export class UpdateRuleDto {
  @IsOptional() @IsString() trigger?: string;

  @IsOptional() @IsInt() @Min(-100) @Max(100) delta?: number;

  @IsOptional() @IsString() category?: string;

  @IsOptional() @IsString() description?: string;

  @IsOptional() @IsBoolean() enabled?: boolean;
}
