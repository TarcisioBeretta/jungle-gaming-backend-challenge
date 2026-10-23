import { IsDateString, IsNumber, IsString } from 'class-validator';
import { Wallet } from '../../../domain/wallet/wallet.aggregate';
import { MoneyDto } from './money.dto';

export class WalletResponseDto {
  @IsString()
  id!: string;

  @IsString()
  playerId!: string;

  @IsString()
  currency!: string;

  balance!: MoneyDto;

  @IsNumber()
  version!: number;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;

  static fromDomain(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      currency: wallet.currency,
      balance: {
        amount: wallet.balance.toString(),
        currency: wallet.balance.currency,
      },
      version: wallet.version,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }
}
