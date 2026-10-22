import { Money } from './money.value-object';
import { InsufficientBalanceError } from '../errors/insufficient-balance.error';

export interface CreateWalletProps {
  playerId: string;
  currency: string;
}

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    private balance: Money,
  ) {}

  public static create(props: CreateWalletProps): Wallet {
    const id = crypto.randomUUID();
    const initialBalance = Money.from({ amount: '0.00', currency: props.currency });
    return new Wallet(id, props.playerId, initialBalance);
  }

  public static restore(id: string, playerId: string, balance: Money): Wallet {
    return new Wallet(id, playerId, balance);
  }

  public credit(amount: Money): void {
    this.balance = this.balance.add(amount);
  }

  public debit(amount: Money): void {
    if (this.balance.isLessThan(amount)) {
      throw new InsufficientBalanceError(this.balance.toString(), amount.toString());
    }

    this.balance = this.balance.subtract(amount);
  }

  public get currentBalance(): Money {
    return this.balance;
  }
}