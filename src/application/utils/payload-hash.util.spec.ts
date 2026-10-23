import { describe, expect, it } from 'bun:test';
import { PayloadHash } from './payload-hash.util';


describe('PayloadHash', () => {
  it('should generate the same hash for equivalent objects regardless of key order', () => {
    const first = { amount: '25.00', currency: 'BRL', playerId: 'p-1' };
    const second = { playerId: 'p-1', currency: 'BRL', amount: '25.00' };

    expect(PayloadHash.from(first)).toBe(PayloadHash.from(second));
  });

  it('should produce a deterministic hash for nested payloads', () => {
    const payload = {
      walletId: 'wallet-1',
      roundId: 'round-2',
      metadata: {
        gameId: 'game-7',
        bet: 10,
      },
    };

    expect(typeof PayloadHash.from(payload)).toBe('string');
    expect(PayloadHash.from(payload)).toHaveLength(64);
  });
});
