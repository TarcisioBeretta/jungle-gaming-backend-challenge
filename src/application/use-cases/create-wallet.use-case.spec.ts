import { describe, expect, it, mock } from 'bun:test';
import { CreateWalletUseCase } from './create-wallet.use-case';
import { WalletRepository } from '../ports/wallet.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { Wallet } from '../../domain/wallet/wallet.aggregate';

describe('CreateWalletUseCase', () => {
  it('should successfully create a wallet, add it to repository and commit transaction', async () => {
    const trackedWallets: Wallet[] = [];
    let commitCalled = false;

    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => null),
      add: mock(async (wallet: Wallet) => {
        trackedWallets.push(wallet);
      }),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const useCase = new CreateWalletUseCase(mockWalletRepository, mockUnitOfWork);

    await useCase.execute({
      id: 'wallet-123',
      userId: 'user-456',
      currency: 'BRL',
    });

    expect(trackedWallets.length).toBe(1);
    expect(trackedWallets[0].id).toBe('wallet-123');
    expect(trackedWallets[0].userId).toBe('user-456');
    expect(trackedWallets[0].currentBalance.amount).toBe('0.00');
    expect(trackedWallets[0].currentBalance.currency).toBe('BRL');
    expect(commitCalled).toBe(true);
  });
});