import { describe, expect, it, mock } from 'bun:test';
import { GetWalletUseCase } from './get-wallet.use-case';
import { WalletRepository } from '../ports/wallet.repository';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletNotFoundError } from 'src/domain/errors/wallet-not-found.error';


describe('GetWalletUseCase', () => {
  it('should successfully return a wallet when it exists', async () => {
    const mockWallet = Wallet.restore(
      'wallet-123',
      'player-456',
      Money.from({ amount: '100.00', currency: 'BRL' }),
    );

    const mockWalletRepository: WalletRepository = {
      findById: mock(async (id: string) => (id === 'wallet-123' ? mockWallet : null)),
      update: mock(async () => {}),
      add: mock(async () => {}),
    };

    const useCase = new GetWalletUseCase(mockWalletRepository);

    const result = await useCase.execute({ walletId: 'wallet-123' });

    expect(result).toBe(mockWallet);
    expect(result.id).toBe('wallet-123');
    expect(result.playerId).toBe('player-456');
    expect(result.currentBalance.amount).toBe('100.00');
  });

  it('should throw WalletNotFoundError when wallet does not exist', async () => {
    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => null),
      update: mock(async () => {}),
      add: mock(async () => {}),
    };

    const useCase = new GetWalletUseCase(mockWalletRepository);

    await expect(
      useCase.execute({ walletId: 'non-existent-id' }),
    ).rejects.toThrow(WalletNotFoundError);
  });
});