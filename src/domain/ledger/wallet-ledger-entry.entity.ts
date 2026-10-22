import { Money } from '../value-objects/money.value-object';
import { WalletLedgerEntryKind } from './wallet-ledger-entry-kind.enum';

export class WalletLedgerEntry {
  private constructor(
    private readonly _id: string,
    private readonly _walletId: string,
    private readonly _transactionId: string,
    private readonly _kind: WalletLedgerEntryKind,
    private readonly _money: Money,
    private readonly _createdAt: Date,
  ) {}

  public static create(props: {
    id?: string;
    walletId: string;
    transactionId: string;
    kind: WalletLedgerEntryKind;
    money: Money;
  }): WalletLedgerEntry {
    return new WalletLedgerEntry(
      props.id ?? crypto.randomUUID(),
      props.walletId,
      props.transactionId,
      props.kind,
      props.money,
      new Date(),
    );
  }

  public static restore(
    id: string,
    walletId: string,
    transactionId: string,
    kind: WalletLedgerEntryKind,
    money: Money,
    createdAt: Date,
  ): WalletLedgerEntry {
    return new WalletLedgerEntry(id, walletId, transactionId, kind, money, createdAt);
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
}