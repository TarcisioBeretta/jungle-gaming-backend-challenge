import { IntegrationEvent } from './integration-event';
import { WagerTransaction } from '../wager/wager-transaction.aggregate';
import { MoneyProps } from '../value-objects/money.value-object';

export interface WagerTransactionRejectedData {
  transactionId: string;
  providerId: string;
  externalTransactionId: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  kind: string;
  money: MoneyProps;
  failureCode?: string;
}

export class WagerTransactionRejected extends IntegrationEvent<WagerTransactionRejectedData> {
  readonly eventType = 'WagerTransactionRejected';
  readonly version = 1;

  static from(
    transaction: WagerTransaction,
    failureCode: string | undefined,
    ctx: { correlationId: string; causationId?: string },
  ): WagerTransactionRejected {
    return new WagerTransactionRejected({
      aggregateId: transaction.id,
      correlationId: ctx.correlationId,
      causationId: ctx.causationId,
      data: {
        transactionId: transaction.id,
        providerId: transaction.providerId,
        externalTransactionId: transaction.externalTransactionId,
        walletId: transaction.walletId,
        playerId: transaction.playerId,
        roundId: transaction.roundId,
        gameId: transaction.gameId,
        kind: transaction.kind,
        money: transaction.money.toJSON(),
        failureCode,
      },
    });
  }
}