import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { WagerTransaction } from '../../../domain/wager/wager-transaction.aggregate';
import { MoneyDto } from './money.dto';

export class TransactionResponseDto {
  @IsString()
  transactionId!: string;

  @IsString()
  status!: string;

  balance!: MoneyDto;

  @IsBoolean()
  idempotentReplay!: boolean;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  externalTransactionId?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  payloadHash?: string;

  @IsOptional()
  @IsString()
  walletId?: string;

  @IsOptional()
  @IsString()
  playerId?: string;

  @IsOptional()
  @IsString()
  roundId?: string;

  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsString()
  kind?: string;

  @IsOptional()
  money?: MoneyDto;

  @IsOptional()
  @IsString()
  referenceExternalTransactionId?: string;

  @IsOptional()
  @IsString()
  referenceTransactionId?: string;

  @IsOptional()
  @IsString()
  failureCode?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  processedAt?: string;

  static fromDomain(
    transaction: WagerTransaction,
    idempotentReplay = false,
  ): TransactionResponseDto {
    return {
      transactionId: transaction.id,
      status: transaction.status,
      balance: {
        amount: transaction.money.toString(),
        currency: transaction.money.currency,
      },
      idempotentReplay,
    };
  }
}
