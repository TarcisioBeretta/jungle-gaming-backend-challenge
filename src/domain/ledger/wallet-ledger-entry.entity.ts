import { LedgerEntryBalanceInconsistentError } from '../errors/ledger-entry-balance-inconsistent.error';
import { Money } from '../value-objects/money.value-object';
import { WalletLedgerEntryKind } from './wallet-ledger-entry-kind.enum';

export class WalletLedgerEntry {
  private constructor(
    private readonly _id: string,
    private readonly _walletId: string,
    private readonly _transactionId: string,
    private readonly _kind: WalletLedgerEntryKind,
    private readonly _money: Money,
    private readonly _balanceBefore: Money,
    private readonly _balanceAfter: Money,
    private readonly _createdAt: Date,
  ) {}

  public static create(props: {
    id?: string;
    walletId: string;
    transactionId: string;
    kind: WalletLedgerEntryKind;
    money: Money;
    balanceBefore?: Money;
    balanceAfter?: Money;
  }): WalletLedgerEntry {
    const balanceBefore = props.balanceBefore ?? Money.zero(props.money.currency);
    const balanceAfter = props.balanceAfter ?? this.calculateBalanceAfter(props.kind, balanceBefore, props.money);

    const entry = new WalletLedgerEntry(
      props.id ?? crypto.randomUUID(),
      props.walletId,
      props.transactionId,
      props.kind,
      props.money,
      balanceBefore,
      balanceAfter,
      new Date(),
    );

    entry.validateBalance();

    return entry;
  }

  public static restore(
    id: string,
    walletId: string,
    transactionId: string,
    kind: WalletLedgerEntryKind,
    money: Money,
    createdAt: Date,
    balanceBefore?: Money,
    balanceAfter?: Money,
  ): WalletLedgerEntry {
    const resolvedBalanceBefore = balanceBefore ?? Money.zero(money.currency);
    const resolvedBalanceAfter = balanceAfter ?? this.calculateBalanceAfter(kind, resolvedBalanceBefore, money);

    const entry = new WalletLedgerEntry(
      id,
      walletId,
      transactionId,
      kind,
      money,
      resolvedBalanceBefore,
      resolvedBalanceAfter,
      createdAt,
    );

    entry.validateBalance();

    return entry;
  }

  private static calculateBalanceAfter(
    kind: WalletLedgerEntryKind,
    balanceBefore: Money,
    money: Money,
  ): Money {
    if (kind === WalletLedgerEntryKind.CREDIT) {
      return balanceBefore.add(money);
    }

    return balanceBefore.subtract(money);
  }

  public get id(): string {
    return this._id;
  }

  public get walletId(): string {
    return this._walletId;
  }

  public get transactionId(): string {
    return this._transactionId;
  }

  public get kind(): WalletLedgerEntryKind {
    return this._kind;
  }

  public get money(): Money {
    return this._money;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get balanceBefore(): Money {
    return this._balanceBefore;
  }

  public get balanceAfter(): Money {
    return this._balanceAfter;
  }

  public isBalanced(): boolean {
    if (this._kind === WalletLedgerEntryKind.CREDIT) {
      return this._balanceAfter.equals(this._balanceBefore.add(this._money));
    } else {
      return this._balanceAfter.equals(this._balanceBefore.subtract(this._money));
    }
  }

  private validateBalance(): void {
    if (!this.isBalanced()) {
      throw new LedgerEntryBalanceInconsistentError(this._id);
    }
  }
}