import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { WalletLedgerEntry } from '../../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../../domain/ledger/wallet-ledger-entry-kind.enum';
import { Money } from '../../../domain/value-objects/money.value-object';

@Entity({ tableName: 'wallet_ledger_entries' })
export class WalletLedgerEntryEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'wallet_id', type: 'string' })
  walletId!: string;

  @Property({ fieldName: 'transaction_id', type: 'string' })
  transactionId!: string;

  @Property({ fieldName: 'kind', type: 'string' })
  kind!: WalletLedgerEntryKind;

  @Property({ fieldName: 'money_amount', type: 'string' })
  moneyAmount!: string;

  @Property({ fieldName: 'money_currency', type: 'string' })
  moneyCurrency!: string;

  @Property({ fieldName: 'balance_before_amount', type: 'string' })
  balanceBeforeAmount!: string;

  @Property({ fieldName: 'balance_before_currency', type: 'string' })
  balanceBeforeCurrency!: string;

  @Property({ fieldName: 'balance_after_amount', type: 'string' })
  balanceAfterAmount!: string;

  @Property({ fieldName: 'balance_after_currency', type: 'string' })
  balanceAfterCurrency!: string;

  @Property({ fieldName: 'created_at', type: 'Date' })
  createdAt!: Date;

  static fromDomain(entry: WalletLedgerEntry): WalletLedgerEntryEntity {
    const entity = new WalletLedgerEntryEntity();
    entity.applyFromDomain(entry);
    return entity;
  }

  applyFromDomain(entry: WalletLedgerEntry): void {
    this.id = entry.id;
    this.walletId = entry.walletId;
    this.transactionId = entry.transactionId;
    this.kind = entry.kind;
    this.moneyAmount = entry.money.amount;
    this.moneyCurrency = entry.money.currency;
    this.balanceBeforeAmount = entry.balanceBefore.amount;
    this.balanceBeforeCurrency = entry.balanceBefore.currency;
    this.balanceAfterAmount = entry.balanceAfter.amount;
    this.balanceAfterCurrency = entry.balanceAfter.currency;
    this.createdAt = entry.createdAt;
  }

  toDomain(): WalletLedgerEntry {
    return WalletLedgerEntry.restore(
      this.id,
      this.walletId,
      this.transactionId,
      this.kind,
      Money.from({
        amount: this.moneyAmount,
        currency: this.moneyCurrency,
      }),
      this.createdAt,
      Money.from({
        amount: this.balanceBeforeAmount,
        currency: this.balanceBeforeCurrency,
      }),
      Money.from({
        amount: this.balanceAfterAmount,
        currency: this.balanceAfterCurrency,
      }),
    );
  }
}
