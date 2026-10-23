import { IntegrationEvent } from './integration-event';
import { WagerTransaction } from '../wager/wager-transaction.aggregate';
import { MoneyProps } from '../value-objects/money.value-object';

export interface WagerTransactionPendingReferenceData {
  transactionId: string;
  providerId: string;
  externalTransactionId: string;
  referenceExternalTransactionId?: string;
  walletId: string;
  playerId: string;
  kind: string;
  money: MoneyProps;
}

export class WagerTransactionPendingReference extends IntegrationEvent<WagerTransactionPendingReferenceData> {
  readonly eventType = 'WagerTransactionPendingReference';
  readonly version = 1;

  static from(
    transaction: WagerTransaction,
    ctx: { correlationId: string; causationId?: string },
  ): WagerTransactionPendingReference {
    return new WagerTransactionPendingReference({
      aggregateId: transaction.id,
      correlationId: ctx.correlationId,
      causationId: ctx.causationId,
      data: {
        transactionId: transaction.id,
        providerId: transaction.providerId,
        externalTransactionId: transaction.externalTransactionId,
        referenceExternalTransactionId: transaction.referenceExternalTransactionId,
        walletId: transaction.walletId,
        playerId: transaction.playerId,
        kind: transaction.kind,
        money: transaction.money.toJSON(),
      },
    });
  }
}