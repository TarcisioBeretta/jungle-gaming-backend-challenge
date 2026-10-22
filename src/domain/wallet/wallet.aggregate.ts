import { Money } from '../value-objects/money.value-object';
import { InsufficientBalanceError } from '../errors/insufficient-balance.error';

export interface CreateWalletProps {
  playerId: string;
  currency: string;
}

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly currency: string,
    private _balance: Money,
    private _version: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  public static create(props: CreateWalletProps): Wallet {
    const id = crypto.randomUUID();
    const initialBalance = Money.zero(props.currency);
    const now = new Date();
    return new Wallet(id, props.playerId, props.currency, initialBalance, 1, now, now);
  }

  public static restore(
    id: string,
    playerId: string,
    currency: string,
    balance: Money,
    version: number,
    createdAt: Date,
    updatedAt: Date,
  ): Wallet {
    return new Wallet(id, playerId, currency, balance, version, createdAt, updatedAt);
  }

  public credit(amount: Money): void {
    this._balance = this._balance.add(amount);
    this._version++;
    this._updatedAt = new Date();
  }

  public debit(amount: Money): void {
    if (this._balance.isLessThan(amount)) {
      throw new InsufficientBalanceError(this._balance.toString(), amount.toString());
    }

    this._balance = this._balance.subtract(amount);
    this._version++;
    this._updatedAt = new Date();
  }

  public get balance(): Money {
    return this._balance;
  }

  public get currentBalance(): Money {
    return this._balance;
  }

  public get version(): number {
    return this._version;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
}