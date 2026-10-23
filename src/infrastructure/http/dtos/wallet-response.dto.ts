import { IsDateString, IsNumber, IsString } from 'class-validator';
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
}
