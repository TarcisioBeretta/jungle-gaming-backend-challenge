import { IntegrationEvent } from './integration-event';
import { Wallet } from '../wallet/wallet.aggregate';
import { WalletLedgerEntry } from '../ledger/wallet-ledger-entry.entity';
import { MoneyProps } from '../value-objects/money.value-object';

export interface WalletBalanceChangedData {
  walletId: string;
  transactionId: string;
  direction: string;
  money: MoneyProps;
  balanceBefore: MoneyProps;
  balanceAfter: MoneyProps;
  walletVersion: number;
}

export class WalletBalanceChanged extends IntegrationEvent<WalletBalanceChangedData> {
  readonly eventType = 'WalletBalanceChanged';
  readonly version = 1;

  static from(
    wallet: Wallet,
    entry: WalletLedgerEntry,
    ctx: { correlationId: string; causationId?: string },
  ): WalletBalanceChanged {
    return new WalletBalanceChanged({
      aggregateId: wallet.id,
      correlationId: ctx.correlationId,
      causationId: ctx.causationId,
      data: {
        walletId: wallet.id,
        transactionId: entry.transactionId,
        direction: entry.kind,
        money: entry.money.toJSON(),
        balanceBefore: entry.balanceBefore.toJSON(),
        balanceAfter: entry.balanceAfter.toJSON(),
        walletVersion: wallet.version,
      },
    });
  }
}