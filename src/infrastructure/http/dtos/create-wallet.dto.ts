import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { MoneyDto } from './money.dto';

export class CreateWalletDto {
  @IsString()
  @IsUUID()
  playerId!: string;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsOptional()
  initialBalance?: MoneyDto;
}
