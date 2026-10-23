import { IsString, Length, Matches } from 'class-validator';

export class MoneyDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a numeric string with up to 2 decimal places',
  })
  amount!: string;

  @IsString()
  @Length(3, 3)
  currency!: string;
}
