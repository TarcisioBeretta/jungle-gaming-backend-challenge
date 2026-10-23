import { describe, expect, it, mock } from 'bun:test';
import { ProcessRollbackUseCase } from './process-rollback.use-case';
import type { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import type { WalletRepository } from '../ports/wallet.repository';
import type { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import type { OutboxRepository } from '../ports/outbox.repository';
import type { UnitOfWork } from '../ports/unit-of-work.interface';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WagerTransactionStatus } from '../../domain/wager/wager-transaction-status.enum';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';
import { OriginalTransactionNotFoundError } from '../../domain/errors/original-transaction-not-found.error';
import type { WagerTransactionIdempotencyServicePort } from '../ports/wager-transaction-idempotency.service';
import { OutboxMessage } from '../../domain/outbox/outbox-message.entity';

describe('ProcessRollbackUseCase', () => {
  const baseCommand = {
    providerId: 'provider-a',
    externalTransactionId: 'ext-rb-1',
    idempotencyKey: 'key-rb-1',
    payloadHash: 'hash-abc',
    walletId: 'wallet-1',
    playerId: 'player-1',
    roundId: 'round-1',
    gameId: 'game-1',
    amount: '30.00',
    currency: 'BRL',
    referenceExternalTransactionId: 'ext-bet-1',
  };

  it('should successfully process a rollback for a Bet (credit wallet, create CREDIT ledger entry, and commit)', async () => {
    const initialBalance = Money.from({ amount: '70.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-1', 'player-1', 'BRL', initialBalance, 1, new Date(), new Date());

    const originalBet = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-bet-1',
      idempotencyKey: 'key-bet-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money: Money.from({ amount: '30.00', currency: 'BRL' }),
    });

    let commitCalled = false;
    let addedTransaction: WagerTransaction | null = null;
    let addedLedgerEntry: WalletLedgerEntry | null = null;
    let updatedWallet: Wallet | null = null;
    const addedOutboxMessages: OutboxMessage[] = [];

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async () => originalBet),
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

    const mockOutboxRepository: OutboxRepository = {
      add: mock(async (msg: OutboxMessage) => {
        addedOutboxMessages.push(msg);
      }),
      findPending: mock(async () => []),
      update: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => null),
    };

    const useCase = new ProcessRollbackUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockOutboxRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    const result = await useCase.execute({
      ...baseCommand,
      referenceExternalTransactionId: 'ext-bet-1',
    });

    expect(result).toBeDefined();
    expect(result.kind).toBe(WagerTransactionKind.Rollback);
    expect(result.status).toBe(WagerTransactionStatus.Processed);
    expect(result.referenceExternalTransactionId).toBe('ext-bet-1');
    expect(result.processedAt).toBeDefined();
    expect(addedTransaction).not.toBeNull();
    expect(addedLedgerEntry?.kind).toBe(WalletLedgerEntryKind.CREDIT);
    expect(updatedWallet?.balance.toString()).toBe('100.00');
    expect(addedOutboxMessages.length).toBe(2);
    expect(commitCalled).toBe(true);
  });

  it('should successfully process a rollback for a Win (debit wallet, create DEBIT ledger entry)', async () => {
    const initialBalance = Money.from({ amount: '200.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-1', 'player-1', 'BRL', initialBalance, 1, new Date(), new Date());

    const originalWin = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-win-1',
      idempotencyKey: 'key-win-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Win,
      money: Money.from({ amount: '150.00', currency: 'BRL' }),
    });

    let addedLedgerEntry: WalletLedgerEntry | null = null;
    let updatedWallet: Wallet | null = null;
    const addedOutboxMessages: OutboxMessage[] = [];

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async () => originalWin),
      add: mock(async () => {}),
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

    const mockOutboxRepository: OutboxRepository = {
      add: mock(async (msg: OutboxMessage) => {
        addedOutboxMessages.push(msg);
      }),
      findPending: mock(async () => []),
      update: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {}),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => null),
    };

    const useCase = new ProcessRollbackUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockOutboxRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    const result = await useCase.execute({
      ...baseCommand,
      amount: '150.00',
      referenceExternalTransactionId: 'ext-win-1',
    });

    expect(result.kind).toBe(WagerTransactionKind.Rollback);
    expect(addedLedgerEntry?.kind).toBe(WalletLedgerEntryKind.DEBIT);
    expect(updatedWallet?.balance.toString()).toBe('50.00');
    expect(addedOutboxMessages.length).toBe(2);
  });

  it('should successfully process a rollback for a Loss (no balance change, no ledger entry)', async () => {
    const initialBalance = Money.from({ amount: '100.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-1', 'player-1', 'BRL', initialBalance, 1, new Date(), new Date());

    const originalLoss = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-loss-1',
      idempotencyKey: 'key-loss-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Loss,
      money: Money.from({ amount: '50.00', currency: 'BRL' }),
    });

    let ledgerAdded = false;
    let walletUpdated = false;
    const addedOutboxMessages: OutboxMessage[] = [];

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async () => originalLoss),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => wallet),
      update: mock(async () => {
        walletUpdated = true;
      }),
      add: mock(async () => {}),
    };

    const mockWalletLedgerRepository: WalletLedgerRepository = {
      add: mock(async () => {
        ledgerAdded = true;
      }),
      findByWalletIdPaginated: mock(async () => []),
      findAllByWalletId: mock(async () => []),
    };

    const mockOutboxRepository: OutboxRepository = {
      add: mock(async (msg: OutboxMessage) => {
        addedOutboxMessages.push(msg);
      }),
      findPending: mock(async () => []),
      update: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {}),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => null),
    };

    const useCase = new ProcessRollbackUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockOutboxRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    const result = await useCase.execute({
      ...baseCommand,
      referenceExternalTransactionId: 'ext-loss-1',
    });

    expect(result.kind).toBe(WagerTransactionKind.Rollback);
    expect(ledgerAdded).toBe(false);
    expect(walletUpdated).toBe(false);
    expect(wallet.balance.toString()).toBe('100.00');
    expect(addedOutboxMessages.length).toBe(1);
  });

  it('should return existing transaction if idempotency key already exists', async () => {
    const money = Money.from({ amount: '30.00', currency: 'BRL' });
    const existingTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-rb-1',
      idempotencyKey: 'key-rb-1',
      payloadHash: 'hash-abc',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Rollback,
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

    const mockOutboxRepository: OutboxRepository = {
      add: mock(async () => {}),
      findPending: mock(async () => []),
      update: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => existingTransaction),
    };

    const useCase = new ProcessRollbackUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockOutboxRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    const result = await useCase.execute(baseCommand);

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

    const mockOutboxRepository: OutboxRepository = {
      add: mock(async () => {}),
      findPending: mock(async () => []),
      update: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {}),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => null),
    };

    const useCase = new ProcessRollbackUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockOutboxRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    await expect(useCase.execute(baseCommand)).rejects.toThrow(WalletNotFoundError);
  });

  it('should throw OriginalTransactionNotFoundError when original transaction does not exist', async () => {
    const wallet = Wallet.restore('wallet-1', 'player-1', 'BRL', Money.from({ amount: '100.00', currency: 'BRL' }), 1, new Date(), new Date());

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => wallet),
      update: mock(async () => {}),
      add: mock(async () => {}),
    };

    const mockWalletLedgerRepository: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => []),
      findAllByWalletId: mock(async () => []),
    };

    const mockOutboxRepository: OutboxRepository = {
      add: mock(async () => {}),
      findPending: mock(async () => []),
      update: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {}),
    };

    const mockIdempotencyService: WagerTransactionIdempotencyServicePort = {
      ensureUnique: mock(async () => null),
    };

    const useCase = new ProcessRollbackUseCase(
      mockWagerTransactionRepository,
      mockWalletRepository,
      mockWalletLedgerRepository,
      mockOutboxRepository,
      mockUnitOfWork,
      mockIdempotencyService,
    );

    await expect(useCase.execute(baseCommand)).rejects.toThrow(OriginalTransactionNotFoundError);
  });
});