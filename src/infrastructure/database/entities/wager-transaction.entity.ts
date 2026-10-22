import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { WagerTransaction } from '../../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../../domain/wager/wager-transaction-kind.enum';
import { WagerTransactionStatus } from '../../../domain/wager/wager-transaction-status.enum';
import { Money } from '../../../domain/value-objects/money.value-object';

@Entity({ tableName: 'wager_transactions' })
export class WagerTransactionEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'provider_id', type: 'string' })
  providerId!: string;

  @Property({ fieldName: 'external_transaction_id', type: 'string' })
  externalTransactionId!: string;

  @Property({ fieldName: 'idempotency_key', type: 'string' })
  idempotencyKey!: string;

  @Property({ fieldName: 'payload_hash', type: 'string' })
  payloadHash!: string;

  @Property({ fieldName: 'wallet_id', type: 'string' })
  walletId!: string;

  @Property({ fieldName: 'player_id', type: 'string' })
  playerId!: string;

  @Property({ fieldName: 'round_id', type: 'string' })
  roundId!: string;

  @Property({ fieldName: 'game_id', type: 'string' })
  gameId!: string;

  @Property({ fieldName: 'kind', type: 'string' })
  kind!: WagerTransactionKind;

  @Property({ fieldName: 'money_amount', type: 'string' })
  moneyAmount!: string;

  @Property({ fieldName: 'money_currency', type: 'string' })
  moneyCurrency!: string;

  @Property({ fieldName: 'reference_external_transaction_id', type: 'string', nullable: true })
  referenceExternalTransactionId?: string;

  @Property({ fieldName: 'created_at', type: 'Date' })
  createdAt!: Date;

  @Property({ fieldName: 'status', type: 'string' })
  status!: WagerTransactionStatus;

  @Property({ fieldName: 'reference_transaction_id', type: 'string', nullable: true })
  referenceTransactionId?: string;

  @Property({ fieldName: 'failure_code', type: 'string', nullable: true })
  failureCode?: string;

  @Property({ fieldName: 'processed_at', type: 'Date', nullable: true })
  processedAt?: Date;

  static fromDomain(transaction: WagerTransaction): WagerTransactionEntity {
    const entity = new WagerTransactionEntity();
    entity.applyFromDomain(transaction);
    return entity;
  }

  applyFromDomain(transaction: WagerTransaction): void {
    this.id = transaction.id;
    this.providerId = transaction.providerId;
    this.externalTransactionId = transaction.externalTransactionId;
    this.idempotencyKey = transaction.idempotencyKey;
    this.payloadHash = transaction.payloadHash;
    this.walletId = transaction.walletId;
    this.playerId = transaction.playerId;
    this.roundId = transaction.roundId;
    this.gameId = transaction.gameId;
    this.kind = transaction.kind;
    this.moneyAmount = transaction.money.amount;
    this.moneyCurrency = transaction.money.currency;
    this.referenceExternalTransactionId = transaction.referenceExternalTransactionId;
    this.createdAt = transaction.createdAt;
    this.status = transaction.status;
    this.referenceTransactionId = transaction.referenceTransactionId;
    this.failureCode = transaction.failureCode;
    this.processedAt = transaction.processedAt;
  }

  toDomain(): WagerTransaction {
    return WagerTransaction.restore(
      this.id,
      this.providerId,
      this.externalTransactionId,
      this.idempotencyKey,
      this.payloadHash,
      this.walletId,
      this.playerId,
      this.roundId,
      this.gameId,
      this.kind,
      Money.from({
        amount: this.moneyAmount,
        currency: this.moneyCurrency,
      }),
      this.referenceExternalTransactionId,
      this.createdAt,
      this.status,
      this.referenceTransactionId,
      this.failureCode,
      this.processedAt,
    );
  }
}
