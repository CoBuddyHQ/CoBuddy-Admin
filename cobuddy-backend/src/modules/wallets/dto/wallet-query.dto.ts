import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dto/pagination.dto';

export class EscrowQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @IsString() status?: string;
}

export const WALLET_OWNER_TYPES = ['CUSTOMER', 'COMPANION'] as const;
export type WalletOwnerType = (typeof WALLET_OWNER_TYPES)[number];
