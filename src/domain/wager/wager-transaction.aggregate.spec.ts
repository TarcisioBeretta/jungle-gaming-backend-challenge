import { describe, expect, it } from 'bun:test';
import { WagerTransaction } from './wager-transaction.aggregate';
import { WagerTransactionKind } from './wager-transaction-kind.enum';
import { WagerTransactionStatus } from './wager-transaction-status.enum';
import { Money } from '../wallet/money.value-object';
import { InvalidStateTransitionError } from '../errors/invalid-state-transition.error';
import { TransactionReferenceRequiredError } from '../errors/transaction-reference-required.error';
import { UnexpectedTransactionReferenceError } from '../errors/unexpected-transaction-reference.error';
import { MissingTransactionReferenceError } from '../errors/missing-transaction-reference.error';

describe('WagerTransaction Aggregate', () => {
  it('should create a wager transaction with PENDING status and domain-generated id', () => {
    const money = Money.from({ amount: '25.00', currency: 'BRL' });
    
    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-tx-123',
      idempotencyKey: 'provider-a:ext-tx-123',
      payloadHash: 'abc123hash',
      walletId: 'wallet-456',
      playerId: 'player-789',
      roundId: 'round-999',
      gameId: 'fortune-chimp',
      kind: WagerTransactionKind.Bet,
      money,
    });

    expect(transaction.id).toBeDefined();
    expect(typeof transaction.id).toBe('string');
    expect(transaction.status).toBe(WagerTransactionStatus.Pending);
    expect(transaction.money.amount).toBe('25.00');
    expect(transaction.money.currency).toBe('BRL');
  });

it('should correctly identify if transaction affects balance for all transaction kinds', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const createTxWithKind = (kind: WagerTransactionKind) =>
      WagerTransaction.create({
        providerId: 'provider-a',
        externalTransactionId: `ext-${kind}`,
        idempotencyKey: `key-${kind}`,
        payloadHash: 'hash-1',
        walletId: 'wallet-1',
        playerId: 'player-1',
        roundId: 'round-1',
        gameId: 'game-1',
        kind,
        money,
      });

    expect(createTxWithKind(WagerTransactionKind.Loss).affectsBalance()).toBe(false);
    expect(createTxWithKind(WagerTransactionKind.Opening).affectsBalance()).toBe(true);
    expect(createTxWithKind(WagerTransactionKind.Bet).affectsBalance()).toBe(true);
    expect(createTxWithKind(WagerTransactionKind.Win).affectsBalance()).toBe(true);
    expect(createTxWithKind(WagerTransactionKind.Refund).affectsBalance()).toBe(true);
    expect(createTxWithKind(WagerTransactionKind.Rollback).affectsBalance()).toBe(true);
  });

  it('should validate payload hash matching correctly', () => {
    const money = Money.from({ amount: '50.00', currency: 'BRL' });

    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-123',
      idempotencyKey: 'key-123',
      payloadHash: 'exact-hash-value',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });

    expect(transaction.matchesPayload('exact-hash-value')).toBe(true);
    expect(transaction.matchesPayload('different-hash')).toBe(false);
  });

  it('should transition to PROCESSED status successfully using markProcessed for autonomous transactions', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-123',
      idempotencyKey: 'key-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });

    transaction.markProcessed();

    expect(transaction.status).toBe(WagerTransactionStatus.Processed);
    expect(transaction.processedAt).toBeDefined();
  });

  it('should transition to PROCESSED status successfully using markProcessedWithReference for reference-required transactions', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const refundTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-refund-123',
      idempotencyKey: 'key-refund-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Refund,
      money,
    });

    refundTransaction.markProcessedWithReference('original-tx-uuid-456');

    expect(refundTransaction.status).toBe(WagerTransactionStatus.Processed);
    expect(refundTransaction.referenceTransactionId).toBe('original-tx-uuid-456');
    expect(refundTransaction.processedAt).toBeDefined();
  });

  it('should transition through PendingReference and then Processed successfully', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const refundTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-refund-123',
      idempotencyKey: 'key-refund-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Refund,
      money,
    });

    refundTransaction.markPendingReference();
    expect(refundTransaction.status).toBe(WagerTransactionStatus.PendingReference);
    expect(refundTransaction.processedAt).toBeUndefined();

    refundTransaction.markProcessedWithReference('original-tx-uuid-456');
    expect(refundTransaction.status).toBe(WagerTransactionStatus.Processed);
    expect(refundTransaction.referenceTransactionId).toBe('original-tx-uuid-456');
    expect(refundTransaction.processedAt).toBeDefined();
  });

  it('should transition to REJECTED status successfully', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-123',
      idempotencyKey: 'key-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });

    transaction.reject('INSUFFICIENT_FUNDS');

    expect(transaction.status).toBe(WagerTransactionStatus.Rejected);
    expect(transaction.failureCode).toBe('INSUFFICIENT_FUNDS');
    expect(transaction.processedAt).toBeDefined();
  });

  it('should transition to FAILED status successfully', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-123',
      idempotencyKey: 'key-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });

    transaction.fail('INTERNAL_ERROR');

    expect(transaction.status).toBe(WagerTransactionStatus.Failed);
    expect(transaction.failureCode).toBe('INTERNAL_ERROR');
    expect(transaction.processedAt).toBeDefined();
  });

  it('should throw TransactionReferenceRequiredError if markProcessed is called on a transaction requiring reference', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const refundTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-refund-123',
      idempotencyKey: 'key-refund-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Refund,
      money,
    });

    expect(() => {
      refundTransaction.markProcessed();
    }).toThrow(TransactionReferenceRequiredError);
  });

  it('should throw UnexpectedTransactionReferenceError if markProcessedWithReference is called on a transaction not requiring reference', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const betTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-bet-123',
      idempotencyKey: 'key-bet-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });

    expect(() => {
      betTransaction.markProcessedWithReference('some-id');
    }).toThrow(UnexpectedTransactionReferenceError);
  });

  it('should throw MissingTransactionReferenceError if referenceTransactionId is empty in markProcessedWithReference', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const refundTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-refund-123',
      idempotencyKey: 'key-refund-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Refund,
      money,
    });

    expect(() => {
      refundTransaction.markProcessedWithReference('');
    }).toThrow(MissingTransactionReferenceError);
  });

  it('should throw InvalidStateTransitionError when trying to modify a terminal transaction state', () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });

    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-123',
      idempotencyKey: 'key-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });

    transaction.markProcessed();

    expect(() => {
      transaction.reject('SOME_ERROR_CODE');
    }).toThrow(InvalidStateTransitionError);
  });
});