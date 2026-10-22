import { describe, expect, it, mock } from 'bun:test';
import { GetWalletLedgerUseCase } from './get-wallet-ledger.use-case';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';

describe('GetWalletLedgerUseCase', () => {
  it('should successfully return paginated ledger entries and nextCursor when there are more items', async () => {
    const mockEntries = [
      WalletLedgerEntry.restore('entry-1', 'wallet-123', 'tx-1', WalletLedgerEntryKind.CREDIT, Money.from({ amount: '10.00', currency: 'BRL' }), new Date()),
      WalletLedgerEntry.restore('entry-2', 'wallet-123', 'tx-2', WalletLedgerEntryKind.DEBIT, Money.from({ amount: '5.00', currency: 'BRL' }), new Date()),
      WalletLedgerEntry.restore('entry-3', 'wallet-123', 'tx-3', WalletLedgerEntryKind.CREDIT, Money.from({ amount: '20.00', currency: 'BRL' }), new Date()),
    ];

    const mockLedgerRepository: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => mockEntries),
      findAllByWalletId: mock(async () => mockEntries),
    };

    const useCase = new GetWalletLedgerUseCase(mockLedgerRepository);

    const result = await useCase.execute({
      walletId: 'wallet-123',
      limit: 2,
    });

    expect(result.entries.length).toBe(2);
    expect(result.entries[0].id).toBe('entry-1');
    expect(result.entries[1].id).toBe('entry-2');
    expect(result.nextCursor).toBe('entry-3');
  });

  it('should return paginated ledger entries without nextCursor when results fit within the limit', async () => {
    const mockEntries = [
      WalletLedgerEntry.restore('entry-1', 'wallet-123', 'tx-1', WalletLedgerEntryKind.CREDIT, Money.from({ amount: '10.00', currency: 'BRL' }), new Date()),
    ];

    const mockLedgerRepository: WalletLedgerRepository = {
      add: mock(async () => {}),
      findByWalletIdPaginated: mock(async () => mockEntries),
      findAllByWalletId: mock(async () => mockEntries),
    };

    const useCase = new GetWalletLedgerUseCase(mockLedgerRepository);

    const result = await useCase.execute({
      walletId: 'wallet-123',
      limit: 50,
    });

    expect(result.entries.length).toBe(1);
    expect(result.nextCursor).toBeUndefined();
  });
});