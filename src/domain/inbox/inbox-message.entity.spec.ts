import { describe, expect, it } from 'bun:test';
import { InboxMessage } from './inbox-message.entity';

describe('InboxMessage', () => {
  it('should create a received message as not processed', () => {
    const message = InboxMessage.create({
      messageId: 'msg-1',
      consumerName: 'wager-transaction-consumer',
      payloadHash: 'hash-123',
      payload: { event: 'test' },
    });

    expect(message.isProcessed()).toBe(false);
    expect(message.processedAt).toBeUndefined();
  });

  it('should mark the message as processed', () => {
    const message = InboxMessage.create({
      messageId: 'msg-2',
      consumerName: 'wager-transaction-consumer',
      payloadHash: 'hash-456',
    });

    message.markProcessed();

    expect(message.isProcessed()).toBe(true);
    expect(message.processedAt).toBeInstanceOf(Date);
  });
});
