import { describe, expect, it, mock } from 'bun:test';
import { ReconcileWalletUseCase } from './reconcile-wallet.use-case';
import { WalletRepository } from '../ports/wallet.repository';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

describe('ReconcileWalletUseCase', () => {
  it('should successfully reconcile a consistent wallet', async () => {
    const initialMoney = Money.from({ amount: '100.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-123', 'player-1', 'BRL', initialMoney, 1, new Date(), new Date());

    const ledgerEntries = [
      WalletLedgerEntry.restore(
        'entry-1',
        'wallet-123',
        'tx-1',
        WalletLedgerEntryKind.CREDIT,
        initialMoney,
        new Date(),
      ),
    ];

    const mockWalletRepo: WalletRepository = {
      findById: mock(async () => wallet),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockLedgerRepo: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => ledgerEntries),
      findAllByWalletId: mock(async () => ledgerEntries),
    };

    const useCase = new ReconcileWalletUseCase(mockWalletRepo, mockLedgerRepo);

    const result = await useCase.execute({ walletId: 'wallet-123' });

    expect(result.consistent).toBe(true);
    expect(result.checkedEntries).toBe(1);
    expect(result.storedBalance.amount).toBe('100.00');
    expect(result.calculatedBalance.amount).toBe('100.00');
    expect(result.difference.amount).toBe('0.00');
  });

  it('should detect inconsistency when stored balance differs from ledger calculation', async () => {
    const initialMoney = Money.from({ amount: '100.00', currency: 'BRL' });
    const wallet = Wallet.restore('wallet-123', 'player-1', 'BRL', initialMoney, 1, new Date(), new Date());

    const ledgerEntries = [
      WalletLedgerEntry.restore(
        'entry-1',
        'wallet-123',
        'tx-1',
        WalletLedgerEntryKind.CREDIT,
        Money.from({ amount: '50.00', currency: 'BRL' }),
        new Date(),
      ),
    ];

    const mockWalletRepo: WalletRepository = {
      findById: mock(async () => wallet),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockLedgerRepo: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => ledgerEntries),
      findAllByWalletId: mock(async () => ledgerEntries),
    };

    const useCase = new ReconcileWalletUseCase(mockWalletRepo, mockLedgerRepo);

    const result = await useCase.execute({ walletId: 'wallet-123' });

    expect(result.consistent).toBe(false);
    expect(result.checkedEntries).toBe(1);
    expect(result.storedBalance.amount).toBe('100.00');
    expect(result.calculatedBalance.amount).toBe('50.00');
    expect(result.difference.amount).toBe('-50.00');
  });

  it('should throw WalletNotFoundError if wallet does not exist', async () => {
    const mockWalletRepo: WalletRepository = {
      findById: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockLedgerRepo: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => []),
      findAllByWalletId: mock(async () => []),
    };

    const useCase = new ReconcileWalletUseCase(mockWalletRepo, mockLedgerRepo);

    expect(useCase.execute({ walletId: 'non-existent' })).rejects.toThrow(
      WalletNotFoundError,
    );
  });
});