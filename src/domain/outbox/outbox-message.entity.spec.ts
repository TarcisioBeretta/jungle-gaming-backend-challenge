import { describe, expect, it } from 'bun:test';
import { OutboxMessage } from './outbox-message.entity';

describe('OutboxMessage', () => {
  it('should create a pending outbox message', () => {
    const message = OutboxMessage.create({
      aggregateId: 'wallet-1',
      eventType: 'WalletBalanceChanged',
      payload: { walletId: 'wallet-1', amount: '10.00' },
    });

    expect(message.isPending()).toBe(true);
    expect(message.publishedAt).toBeUndefined();
    expect(message.attempts).toBe(0);
  });

  it('should mark the message as published', () => {
    const message = OutboxMessage.create({
      aggregateId: 'wallet-2',
      eventType: 'WagerTransactionProcessed',
      payload: { transactionId: 'trx-1' },
    });

    message.markPublished();

    expect(message.isPending()).toBe(false);
    expect(message.publishedAt).toBeInstanceOf(Date);
  });

  it('should schedule a retry when the message is pending', () => {
    const message = OutboxMessage.create({
      aggregateId: 'wallet-3',
      eventType: 'WalletBalanceChanged',
      payload: { walletId: 'wallet-3' },
    });

    const now = new Date('2026-01-01T00:00:00.000Z');
    message.scheduleRetry(now, 5_000);

    expect(message.attempts).toBe(1);
    expect(message.nextAttemptAt).toEqual(new Date('2026-01-01T00:00:05.000Z'));
    expect(message.isDue(new Date('2026-01-01T00:00:05.000Z'))).toBe(true);
  });
});
