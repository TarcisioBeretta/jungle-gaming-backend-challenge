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
});