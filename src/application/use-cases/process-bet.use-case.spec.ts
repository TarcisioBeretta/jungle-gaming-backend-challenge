import { describe, expect, it, mock } from 'bun:test';
import { ProcessBetUseCase } from './process-bet.use-case';
import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WalletRepository } from '../ports/wallet.repository';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WagerTransactionStatus } from '../../domain/wager/wager-transaction-status.enum';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

describe('ProcessBetUseCase', () => {
  it('should successfully process a bet, debit the wallet, create ledger entry, mark transaction as processed and commit', async () => {
    const initialBalance = Money.from({ amount: '100.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-1', 'player-1', initialBalance);

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

    const useCase = new ProcessBetUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
    );

    const result = await useCase.execute({
      providerId: 'provider-a',
      externalTransactionId: 'ext-bet-1',
      idempotencyKey: 'key-bet-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      amount: '30.00',
      currency: 'BRL',
    });

    expect(result).toBeDefined();
    expect(result.kind).toBe(WagerTransactionKind.Bet);
    expect(result.status).toBe(WagerTransactionStatus.Processed);
    expect(result.processedAt).toBeDefined();
    expect(addedTransaction).not.toBeNull();
    expect(addedLedgerEntry).not.toBeNull();
    expect(addedLedgerEntry?.kind).toBe(WalletLedgerEntryKind.DEBIT);
    expect(addedLedgerEntry?.money.toString()).toBe('30.00');
    expect(updatedWallet?.currentBalance.toString()).toBe('70.00');
    expect(commitCalled).toBe(true);
  });

  it('should return existing transaction if idempotency key already exists', async () => {
    const money = Money.from({ amount: '30.00', currency: 'BRL' });
    const existingTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-bet-1',
      idempotencyKey: 'key-bet-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });
    existingTransaction.markProcessed();

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

    const useCase = new ProcessBetUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
    );

    const result = await useCase.execute({
      providerId: 'provider-a',
      externalTransactionId: 'ext-bet-1',
      idempotencyKey: 'key-bet-1',
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

    const useCase = new ProcessBetUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
    );

    await expect(
      useCase.execute({
        providerId: 'provider-a',
        externalTransactionId: 'ext-bet-1',
        idempotencyKey: 'key-bet-1',
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