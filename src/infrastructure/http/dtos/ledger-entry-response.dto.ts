import { IsDateString, IsString } from 'class-validator';
import { WalletLedgerEntry } from '../../../domain/ledger/wallet-ledger-entry.entity';
import { MoneyDto } from './money.dto';

export class LedgerEntryResponseDto {
  @IsString()
  id!: string;

  @IsString()
  walletId!: string;

  @IsString()
  transactionId!: string;

  @IsString()
  kind!: string;

  money!: MoneyDto;

  balanceBefore!: MoneyDto;

  balanceAfter!: MoneyDto;

  @IsDateString()
  createdAt!: string;

  static fromDomain(entry: WalletLedgerEntry): LedgerEntryResponseDto {
    return {
      id: entry.id,
      walletId: entry.walletId,
      transactionId: entry.transactionId,
      kind: entry.kind,
      money: {
        amount: entry.money.toString(),
        currency: entry.money.currency,
      },
      balanceBefore: {
        amount: entry.balanceBefore.toString(),
        currency: entry.balanceBefore.currency,
      },
      balanceAfter: {
        amount: entry.balanceAfter.toString(),
        currency: entry.balanceAfter.currency,
      },
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
