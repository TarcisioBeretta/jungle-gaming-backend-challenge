import { describe, expect, it, mock } from 'bun:test';
import { ProcessRefundUseCase } from './process-refund.use-case';
import type { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import type { WalletRepository } from '../ports/wallet.repository';
import type { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import type { UnitOfWork } from '../ports/unit-of-work.interface';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WagerTransactionStatus } from '../../domain/wager/wager-transaction-status.enum';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';
import type { WagerTransactionIdempotencyServicePort } from '../ports/wager-transaction-idempotency.service';

describe('ProcessRefundUseCase', () => {
  it('should successfully process a refund, credit the wallet, create CREDIT ledger entry, mark transaction as processed with reference and commit', async () => {
    const initialBalance = Money.from({ amount: '70.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-1', 'player-1', 'BRL', initialBalance, 1, new Date(), new Date());

    let commitCalled = false;
    let addedTransaction: WagerTransaction | null = null;
    let addedLedgerEntry: WalletLedgerEntry | null = null;
    let updatedWallet: Wallet | null = null;

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async () => null),
      add: mock(async (tx: WagerTransaction) => {
        addedTransaction = tx;
      }),
      update: mock(async () => {}),
    };

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => wallet),
      update: mock(async (w: Wallet) => {
        updatedWallet = w;
      }),
      add: mock(async () => {}),
    };

    const mockWalletLedgerRepository: WalletLedgerRepository = {
      add: mock(async (entry: WalletLedgerEntry) => {
        addedLedgerEntry = entry;
      }),
      findByWalletIdPaginated: mock(async () => []),
      findAllByWalletId: mock(async () => []),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => null),
    };

    const useCase = new ProcessRefundUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    const result = await useCase.execute({
      providerId: 'provider-a',
      externalTransactionId: 'ext-ref-1',
      idempotencyKey: 'key-ref-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      amount: '30.00',
      currency: 'BRL',
      referenceExternalTransactionId: 'ext-bet-1',
    });

    expect(result).toBeDefined();
    expect(result.kind).toBe(WagerTransactionKind.Refund);
    expect(result.status).toBe(WagerTransactionStatus.Processed);
    expect(result.referenceExternalTransactionId).toBe('ext-bet-1');
    expect(result.processedAt).toBeDefined();
    expect(addedTransaction).not.toBeNull();
    expect(addedLedgerEntry).not.toBeNull();
    expect(addedLedgerEntry?.kind).toBe(WalletLedgerEntryKind.CREDIT);
    expect(addedLedgerEntry?.money.toString()).toBe('30.00');
    expect(updatedWallet?.currentBalance.toString()).toBe('100.00');
    expect(commitCalled).toBe(true);
  });

  it('should return existing transaction if idempotency key already exists', async () => {
    const money = Money.from({ amount: '30.00', currency: 'BRL' });
    const existingTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-ref-1',
      idempotencyKey: 'key-ref-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Refund,
      money,
      referenceExternalTransactionId: 'ext-bet-1',
    });
    existingTransaction.markProcessedWithReference('ext-bet-1');

    let walletFindCalled = false;
    let commitCalled = false;

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => existingTransaction),
      findByProviderAndExternalId: mock(async () => null),
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

    const mockWalletLedgerRepository: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => []),
      findAllByWalletId: mock(async () => []),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => existingTransaction),
    };

    const useCase = new ProcessRefundUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    const result = await useCase.execute({
      providerId: 'provider-a',
      externalTransactionId: 'ext-ref-1',
      idempotencyKey: 'key-ref-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      amount: '30.00',
      currency: 'BRL',
      referenceExternalTransactionId: 'ext-bet-1',
    });

    expect(result).toBe(existingTransaction);
    expect(walletFindCalled).toBe(false);
    expect(commitCalled).toBe(false);
  });

  it('should throw WalletNotFoundError when wallet does not exist', async () => {
    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => null),
      update: mock(async () => {}),
      add: mock(async () => {}),
    };

    const mockWalletLedgerRepository: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => []),
      findAllByWalletId: mock(async () => []),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {}),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => null),
    };

    const useCase = new ProcessRefundUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    await expect(
      useCase.execute({
        providerId: 'provider-a',
        externalTransactionId: 'ext-ref-1',
        idempotencyKey: 'key-ref-1',
        payloadHash: 'hash-abc',
        walletId: 'non-existent-wallet',
        playerId: 'player-1',
        roundId: 'round-1',
        gameId: 'game-1',
        amount: '30.00',
        currency: 'BRL',
        referenceExternalTransactionId: 'ext-bet-1',
      }),
    ).rejects.toThrow(WalletNotFoundError);
  });
});