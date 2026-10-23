import { describe, expect, it } from 'bun:test';
import { WagerTransactionIdempotencyService } from './wager-transaction-idempotency.service';
import { IdempotencyKeyConflictError } from '../../domain/errors/idempotency-key-conflict.error';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { Money } from '../../domain/value-objects/money.value-object';

describe('WagerTransactionIdempotencyService', () => {
  it('should return null when the idempotency key does not exist', async () => {
    const repo = {
      findByIdempotencyKey: async () => null,
    } as any;

    const service = new WagerTransactionIdempotencyService(repo);

    const result = await service.ensureUnique('key-1', 'hash-1');

    expect(result).toBeNull();
  });

  it('should return the existing transaction when the payload hash matches', async () => {
    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-1',
      idempotencyKey: 'key-2',
      payloadHash: 'hash-2',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money: Money.from({ amount: '10.00', currency: 'BRL' }),
    });

    const repo = {
      findByIdempotencyKey: async () => transaction,
    } as any;

    const service = new WagerTransactionIdempotencyService(repo);

    const result = await service.ensureUnique('key-2', 'hash-2');

    expect(result).toBe(transaction);
  });

  it('should throw when the same idempotency key is reused with a different payload', async () => {
    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-2',
      idempotencyKey: 'key-3',
      payloadHash: 'hash-3',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money: Money.from({ amount: '10.00', currency: 'BRL' }),
    });

    const repo = {
      findByIdempotencyKey: async () => transaction,
    } as any;

    const service = new WagerTransactionIdempotencyService(repo);

    await expect(service.ensureUnique('key-3', 'different-hash')).rejects.toBeInstanceOf(
      IdempotencyKeyConflictError,
    );
    await expect(service.ensureUnique('key-3', 'different-hash')).rejects.toThrow(
      'Idempotency key "key-3" was already used with a different payload.',
    );
  });
});
