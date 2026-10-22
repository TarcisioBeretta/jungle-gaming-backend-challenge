import { describe, expect, it, mock } from 'bun:test';
import { ProcessLossUseCase } from './process-loss.use-case';
import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WalletRepository } from '../ports/wallet.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WagerTransactionStatus } from '../../domain/wager/wager-transaction-status.enum';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

describe('ProcessLossUseCase', () => {
  it('should successfully process a loss, mark transaction as processed and commit without changing wallet balance', async () => {
    const initialBalance = Money.from({ amount: '70.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-1', 'player-1', 'BRL', initialBalance, 1, new Date(), new Date());

    let commitCalled = false;
    let addedTransaction: WagerTransaction | null = null;
    let walletUpdateCalled = false;

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      add: mock(async (tx: WagerTransaction) => {
        addedTransaction = tx;
      }),
      update: mock(async () => {}),
    };

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => wallet),
      update: mock(async () => {
        walletUpdateCalled = true;
      }),
      add: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const useCase = new ProcessLossUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockUnitOfWork,
    );

    const result = await useCase.execute({
      providerId: 'provider-a',
      externalTransactionId: 'ext-loss-1',
      idempotencyKey: 'key-loss-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      amount: '30.00',
      currency: 'BRL',
    });

    expect(result).toBeDefined();
    expect(result.kind).toBe(WagerTransactionKind.Loss);
    expect(result.status).toBe(WagerTransactionStatus.Processed);
    expect(result.processedAt).toBeDefined();
    expect(addedTransaction).not.toBeNull();
    expect(wallet.currentBalance.toString()).toBe('70.00');
    expect(walletUpdateCalled).toBe(false);
    expect(commitCalled).toBe(true);
  });

  it('should return existing transaction if idempotency key already exists', async () => {
    const money = Money.from({ amount: '30.00', currency: 'BRL' });
    const existingTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-loss-1',
      idempotencyKey: 'key-loss-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Loss,
      money,
    });
    existingTransaction.markProcessed();

    let walletFindCalled = false;
    let commitCalled = false;

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => existingTransaction),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => {
        walletFindCalled = true;
        return null;
      }),
      update: mock(async () => {}),
      add: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const useCase = new ProcessLossUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockUnitOfWork,
    );

    const result = await useCase.execute({
      providerId: 'provider-a',
      externalTransactionId: 'ext-loss-1',
      idempotencyKey: 'key-loss-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      amount: '30.00',
      currency: 'BRL',
    });

    expect(result).toBe(existingTransaction);
    expect(walletFindCalled).toBe(false);
    expect(commitCalled).toBe(false);
  });

  it('should throw WalletNotFoundError when wallet does not exist', async () => {
    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => null),
      update: mock(async () => {}),
      add: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {}),
    };

    const useCase = new ProcessLossUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockUnitOfWork,
    );

    await expect(
      useCase.execute({
        providerId: 'provider-a',
        externalTransactionId: 'ext-loss-1',
        idempotencyKey: 'key-loss-1',
        payloadHash: 'hash-abc',
        walletId: 'non-existent-wallet',
        playerId: 'player-1',
        roundId: 'round-1',
        gameId: 'game-1',
        amount: '30.00',
        currency: 'BRL',
      }),
    ).rejects.toThrow(WalletNotFoundError);
  });
});