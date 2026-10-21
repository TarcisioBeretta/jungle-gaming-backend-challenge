import { describe, expect, it } from 'bun:test';
import { Money } from './money.value-object';
import { InvalidMoneyAmountError } from '../errors/invalid-money-amount.error';
import { NegativeMoneyError } from '../errors/negative-money.error';

describe('Money Value Object', () => {
  it('should create a valid Money instance', () => {
    const money = Money.from({ amount: '25.00', currency: 'BRL' });
    expect(money.amount).toBe('25.00');
    expect(money.currency).toBe('BRL');
  });

  it('should normalize scale to 2 decimal places', () => {
    const money = Money.from({ amount: '25.5', currency: 'BRL' });
    expect(money.amount).toBe('25.50');
  });

  it('should reject invalid formats and extra decimals', () => {
    expect(() => Money.from({ amount: 'NaN', currency: 'BRL' })).toThrow(InvalidMoneyAmountError);
    expect(() => Money.from({ amount: '10.555', currency: 'BRL' })).toThrow(InvalidMoneyAmountError);
  });

  it('should reject negative amount on creation', () => {
    expect(() => Money.from({ amount: '-10.00', currency: 'BRL' })).toThrow(NegativeMoneyError);
  });

  it('should add amounts with same currency', () => {
    const m1 = Money.from({ amount: '25.50', currency: 'BRL' });
    const m2 = Money.from({ amount: '10.25', currency: 'BRL' });
    const result = m1.add(m2);

    expect(result.amount).toBe('35.75');
  });
});