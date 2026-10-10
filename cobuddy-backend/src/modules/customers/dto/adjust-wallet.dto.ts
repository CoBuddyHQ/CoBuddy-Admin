import { IsNumber, IsString, IsIn, Min, Max, MinLength, MaxLength } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class AdjustWalletDto {
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(9999999999.99) amount: number;
  @IsIn(Object.values(TransactionType)) type: TransactionType;
  @IsString() @MinLength(3) @MaxLength(1000) description: string;
}
