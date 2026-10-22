import { describe, expect, it } from 'bun:test';
import { Wallet } from './wallet.aggregate';
import { Money } from './money.value-object';
import { InsufficientBalanceError } from '../errors/insufficient-balance.error';

describe('Wallet Aggregate', () => {
  it('should create a wallet with zero balance and domain-generated id', () => {
    const wallet = Wallet.create({
      playerId: 'player-456',
      currency: 'BRL',
    });

    expect(wallet.id).toBeDefined();
    expect(typeof wallet.id).toBe('string');
    expect(wallet.playerId).toBe('player-456');
    expect(wallet.currentBalance.amount).toBe('0.00');
    expect(wallet.currentBalance.currency).toBe('BRL');
  });

  it('should restore a wallet with an existing id and balance', () => {
    const balance = Money.from({ amount: '150.00', currency: 'USD' });
    const wallet = Wallet.restore('wallet-123', 'player-456', balance);

    expect(wallet.id).toBe('wallet-123');
    expect(wallet.playerId).toBe('player-456');
    expect(wallet.currentBalance.amount).toBe('150.00');
    expect(wallet.currentBalance.currency).toBe('USD');
  });

  it('should credit wallet balance correctly', () => {
    const wallet = Wallet.create({
      playerId: 'player-456',
      currency: 'BRL',
    });

    wallet.credit(Money.from({ amount: '100.50', currency: 'BRL' }));
    wallet.credit(Money.from({ amount: '50.00', currency: 'BRL' }));

    expect(wallet.currentBalance.amount).toBe('150.50');
  });

  it('should debit wallet balance correctly when balance is sufficient', () => {
    const wallet = Wallet.restore(
      'wallet-123',
      'player-456',
      Money.from({ amount: '200.00', currency: 'BRL' }),
    );

    wallet.debit(Money.from({ amount: '75.25', currency: 'BRL' }));

    expect(wallet.currentBalance.amount).toBe('124.75');
  });

  it('should throw InsufficientBalanceError when balance is insufficient for debit', () => {
    const wallet = Wallet.restore(
      'wallet-123',
      'player-456',
      Money.from({ amount: '50.00', currency: 'BRL' }),
    );

    expect(() => {
      wallet.debit(Money.from({ amount: '60.00', currency: 'BRL' }));
    }).toThrow(InsufficientBalanceError);
  });
});