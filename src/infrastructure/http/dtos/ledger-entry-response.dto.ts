import { IsDateString, IsString } from 'class-validator';
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
}
