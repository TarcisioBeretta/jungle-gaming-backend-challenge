import { IsDateString, IsOptional, IsString } from 'class-validator';
import { MoneyDto } from './money.dto';

export class TransactionResponseDto {
  @IsString()
  id!: string;

  @IsString()
  providerId!: string;

  @IsString()
  externalTransactionId!: string;

  @IsString()
  idempotencyKey!: string;

  @IsString()
  payloadHash!: string;

  @IsString()
  walletId!: string;

  @IsString()
  playerId!: string;

  @IsString()
  roundId!: string;

  @IsString()
  gameId!: string;

  @IsString()
  kind!: string;

  money!: MoneyDto;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  referenceExternalTransactionId?: string;

  @IsOptional()
  @IsString()
  referenceTransactionId?: string;

  @IsOptional()
  @IsString()
  failureCode?: string;

  @IsDateString()
  createdAt!: string;

  @IsOptional()
  @IsDateString()
  processedAt?: string;
}
