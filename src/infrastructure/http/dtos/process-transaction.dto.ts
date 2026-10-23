import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { MoneyDto } from './money.dto';

export class ProcessTransactionDto {
  @IsString()
  providerId!: string;

  @IsString()
  externalTransactionId!: string;

  @IsString()
  @IsUUID()
  walletId!: string;

  @IsString()
  @IsUUID()
  playerId!: string;

  @IsString()
  roundId!: string;

  @IsString()
  gameId!: string;

  @IsString()
  @IsIn(['BET', 'WIN', 'LOSS', 'REFUND', 'ROLLBACK'])
  kind!: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  money!: MoneyDto;

  @IsOptional()
  @IsString()
  referenceExternalTransactionId?: string;
}
