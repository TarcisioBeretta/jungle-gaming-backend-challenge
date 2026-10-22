import { describe, expect, it, mock } from 'bun:test';
import { TransactionNotFoundError } from 'src/domain/errors/transaction-not-found-error';
import { WagerTransactionKind } from 'src/domain/wager/wager-transaction-kind.enum';
import { WagerTransaction } from 'src/domain/wager/wager-transaction.aggregate';
import { Money } from 'src/domain/wallet/money.value-object';
import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { GetTransactionByExternalIdUseCase } from './get-transaction-by-external-id.use-case';

describe('GetTransactionByExternalIdUseCase', () => {
  it('should successfully return a transaction when it exists by provider and external id', async () => {
    const mockTransaction = WagerTransaction.create({
      providerId: 'provider-a',
      externalTransactionId: 'tx-ext-123',
      idempotencyKey: 'provider-a:tx-ext-123',
      payloadHash: 'hash-abc',
      walletId: 'wallet-123',
      playerId: 'player-456',
      roundId: 'round-789',
      gameId: 'game-slot',
      kind: WagerTransactionKind.Bet,
      money: Money.from({ amount: '50.00', currency: 'BRL' }),
    });

    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async (providerId: string, extId: string) => 
        providerId === 'provider-a' && extId === 'tx-ext-123' ? mockTransaction : null
      ),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const useCase = new GetTransactionByExternalIdUseCase(mockWagerTransactionRepository);

    const result = await useCase.execute({
      providerId: 'provider-a',
      externalTransactionId: 'tx-ext-123',
    });

    expect(result).toBe(mockTransaction);
    expect(result.providerId).toBe('provider-a');
    expect(result.externalTransactionId).toBe('tx-ext-123');
  });

  it('should throw TransactionNotFoundError when transaction does not exist', async () => {
    const mockWagerTransactionRepository: WagerTransactionRepository = {
      findById: mock(async () => null),
      findByIdempotencyKey: mock(async () => null),
      findByProviderAndExternalId: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const useCase = new GetTransactionByExternalIdUseCase(mockWagerTransactionRepository);

    await expect(
      useCase.execute({
        providerId: 'provider-a',
        externalTransactionId: 'non-existent',
      }),
    ).rejects.toThrow(TransactionNotFoundError);
  });
});