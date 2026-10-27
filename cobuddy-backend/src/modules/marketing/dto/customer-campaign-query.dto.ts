import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomerCampaignQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string;
}
