import { describe, expect, it } from 'bun:test';
import { WalletLedgerEntry } from './wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from './wallet-ledger-entry-kind.enum';
import { Money } from '../value-objects/money.value-object';

describe('WalletLedgerEntry Entity', () => {
  it('should create a new wallet ledger entry correctly', () => {
    const money = Money.from({ amount: '100.00', currency: 'BRL' });

    const entry = WalletLedgerEntry.create({
      walletId: 'wallet-123',
      transactionId: 'tx-456',
      kind: WalletLedgerEntryKind.CREDIT,
      money,
    });

    expect(entry.id).toBeDefined();
    expect(entry.walletId).toBe('wallet-123');
    expect(entry.transactionId).toBe('tx-456');
    expect(entry.kind).toBe(WalletLedgerEntryKind.CREDIT);
    expect(entry.money.equals(money)).toBe(true);
    expect(entry.createdAt).toBeInstanceOf(Date);
  });

  it('should restore an existing wallet ledger entry correctly', () => {
    const money = Money.from({ amount: '50.00', currency: 'BRL' });
    const fixedDate = new Date('2026-01-01T00:00:00.000Z');

    const entry = WalletLedgerEntry.restore(
      'entry-uuid',
      'wallet-123',
      'tx-456',
      WalletLedgerEntryKind.DEBIT,
      money,
      fixedDate,
    );

    expect(entry.id).toBe('entry-uuid');
    expect(entry.walletId).toBe('wallet-123');
    expect(entry.transactionId).toBe('tx-456');
    expect(entry.kind).toBe(WalletLedgerEntryKind.DEBIT);
    expect(entry.money.equals(money)).toBe(true);
    expect(entry.createdAt).toBe(fixedDate);
  });

  it('should restore a ledger entry with explicit balance values', () => {
    const money = Money.from({ amount: '25.00', currency: 'BRL' });
    const balanceBefore = Money.from({ amount: '100.00', currency: 'BRL' });
    const balanceAfter = Money.from({ amount: '75.00', currency: 'BRL' });
    const fixedDate = new Date('2026-01-02T00:00:00.000Z');

    const entry = WalletLedgerEntry.restore(
      'entry-uuid-2',
      'wallet-123',
      'tx-789',
      WalletLedgerEntryKind.DEBIT,
      money,
      fixedDate,
      balanceBefore,
      balanceAfter,
    );

    expect(entry.balanceBefore.equals(balanceBefore)).toBe(true);
    expect(entry.balanceAfter.equals(balanceAfter)).toBe(true);
    expect(entry.isBalanced()).toBe(true);
  });

  it('should throw a domain error when ledger entry balance is inconsistent', () => {
    const money = Money.from({ amount: '25.00', currency: 'BRL' });
    const balanceBefore = Money.from({ amount: '100.00', currency: 'BRL' });
    const invalidBalanceAfter = Money.from({ amount: '10.00', currency: 'BRL' });

    expect(() => {
      WalletLedgerEntry.restore(
        'entry-uuid-3',
        'wallet-123',
        'tx-999',
        WalletLedgerEntryKind.DEBIT,
        money,
        new Date('2026-01-03T00:00:00.000Z'),
        balanceBefore,
        invalidBalanceAfter,
      );
    }).toThrow('Ledger entry with ID "entry-uuid-3" has inconsistent balance.');
  });
});