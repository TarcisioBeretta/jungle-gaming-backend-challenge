import { describe, expect, it, mock } from 'bun:test';
import { CreateWalletUseCase } from './create-wallet.use-case';
import { WalletRepository } from '../ports/wallet.repository';
import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';

describe('CreateWalletUseCase', () => {
  it('should successfully create a wallet with zero balance, add it to repository and commit transaction without opening transaction', async () => {
    const trackedWallets: Wallet[] = [];
    const trackedTransactions: WagerTransaction[] = [];
    let commitCalled = false;

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => null),
      update: mock(async () => {}),
      add: mock(async (wallet: Wallet) => {
        trackedWallets.push(wallet);
      }),
    };

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      add: mock(async (tx: WagerTransaction) => {
        trackedTransactions.push(tx);
      }),
      update: mock(async () => {}),
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

    const useCase = new CreateWalletUseCase(
      mockWalletRepository,
      mockWagerTransactionRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
    );

    await useCase.execute({
      playerId: 'player-456',
      currency: 'BRL',
    });

    expect(trackedWallets.length).toBe(1);
    expect(trackedWallets[0].id).toBeDefined();
    expect(typeof trackedWallets[0].id).toBe('string');
    expect(trackedWallets[0].playerId).toBe('player-456');
    expect(trackedWallets[0].currentBalance.amount).toBe('0.00');
    expect(trackedWallets[0].currentBalance.currency).toBe('BRL');
    
    expect(trackedTransactions.length).toBe(0);
    expect(commitCalled).toBe(true);
  });

  it('should successfully create a wallet with positive initial balance, generate OPENING transaction and commit', async () => {
    const trackedWallets: Wallet[] = [];
    const trackedTransactions: WagerTransaction[] = [];
    let commitCalled = false;

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => null),
      update: mock(async () => {}),
      add: mock(async (wallet: Wallet) => {
        trackedWallets.push(wallet);
      }),
    };

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      add: mock(async (tx: WagerTransaction) => {
        trackedTransactions.push(tx);
      }),
      update: mock(async () => {}),
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

    const useCase = new CreateWalletUseCase(
      mockWalletRepository,
      mockWagerTransactionRepository,
      mockWalletLedgerRepository,
      mockUnitOfWork,
    );

    await useCase.execute({
      playerId: 'player-456',
      currency: 'BRL',
      initialBalance: { amount: '1000.00', currency: 'BRL' },
    });

    expect(trackedWallets.length).toBe(1);
    expect(trackedWallets[0].currentBalance.amount).toBe('1000.00');
    
    expect(trackedTransactions.length).toBe(1);
    expect(trackedTransactions[0].kind).toBe(WagerTransactionKind.Opening);
    expect(trackedTransactions[0].money.amount).toBe('1000.00');
    expect(commitCalled).toBe(true);
  });
});