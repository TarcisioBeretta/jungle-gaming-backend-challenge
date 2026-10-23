import { describe, expect, it, mock } from 'bun:test';
import { GetWagerTransactionByIdUseCase } from './get-wager-transaction-by-id.use-case';
import type { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { Money } from '../../domain/value-objects/money.value-object';

describe('GetWagerTransactionByIdUseCase', () => {
  it('should return a wager transaction when found by id', async () => {
    const money = Money.from({ amount: '10.00', currency: 'BRL' });
    const transaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'ext-123',
      idempotencyKey: 'key-123',
      payloadHash: 'hash',
      walletId: 'wallet-1',
      playerId: 'player-1',
      roundId: 'round-1',
      gameId: 'game-1',
      kind: WagerTransactionKind.Bet,
      money,
    });

    const mockRepository: WagerTransactionRepository = {
      findById: mock(async () => transaction),
      findByIdempotencyKey: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const useCase = new GetWagerTransactionByIdUseCase(mockRepository);

    const result = await useCase.execute({
      transactionId: transaction.id,
    });

    expect(result).toBe(transaction);
    expect(mockRepository.findById).toHaveBeenCalledWith(transaction.id);
  });

  it('should return null when wager transaction is not found', async () => {
    const mockRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const useCase = new GetWagerTransactionByIdUseCase(mockRepository);

    await expect(
      useCase.execute({
        transactionId: 'non-existent-id',
      }),
    ).rejects.toThrow('Wager transaction with ID "non-existent-id" was not found.');

    expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
  });
});