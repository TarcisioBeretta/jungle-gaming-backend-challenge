import Decimal from 'decimal.js';
import { InvalidMoneyAmountError } from '../errors/invalid-money-amount.error';
import { CurrencyMismatchError } from '../errors/currency-mismatch.error';
import { NegativeMoneyError } from '../errors/negative-money.error';

export interface MoneyProps {
  amount: string;
  currency: string;
}

export class Money {
  private constructor(
    private readonly value: Decimal,
    public readonly currency: string,
  ) {
    this.currency = currency.toUpperCase();
  }

  public static from(props: MoneyProps): Money {
    const parsed = this.parseToDecimal(props.amount);

    if (!parsed.isFinite()) {
      throw new InvalidMoneyAmountError(props.amount);
    }

    if (parsed.decimalPlaces() > 2) {
      throw new InvalidMoneyAmountError(props.amount);
    }

    if (parsed.isNegative()) {
      throw new NegativeMoneyError(props.amount);
    }

    return new Money(parsed, props.currency);
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
    return new Money(this.value.plus(other.value), this.currency);
  }

  public equals(other: Money): boolean {
    return this.currency === other.currency && this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toFixed(2);
  }

  public get amount(): string {
    return this.toString();
  }

  private static parseToDecimal(amount: string){
    try {
      return new Decimal(amount);
    } catch {
      throw new InvalidMoneyAmountError(amount);
    }
  }
}