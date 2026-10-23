import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class ProcessTransactionDto {
  @IsString()
  providerId!: string;

  @IsString()
  externalTransactionId!: string;

  @IsString()
  idempotencyKey!: string;

  @IsString()
  payloadHash!: string;

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
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a numeric string with up to 2 decimal places',
  })
  amount!: string;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsOptional()
  @IsString()
  referenceExternalTransactionId?: string;
}
