import { describe, expect, it, mock } from 'bun:test';
import { CreditWalletUseCase } from './credit-wallet.use-case';
import { WalletRepository } from '../ports/wallet.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

describe('CreditWalletUseCase', () => {
  it('should successfully credit an existing wallet, update repository and commit transaction', async () => {
    const existingWallet = Wallet.create({
      id: 'wallet-123',
      userId: 'user-456',
      currency: 'BRL',
    });

    let updateCalled = false;
    let commitCalled = false;

    const mockWalletRepository: WalletRepository = {
      findById: mock(async (id: string) => {
        return id === 'wallet-123' ? existingWallet : null;
      }),
      add: mock(async () => {}),
      update: mock(async () => {
        updateCalled = true;
      }),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {
        commitCalled = true;
      }),
    };

    const useCase = new CreditWalletUseCase(mockWalletRepository, mockUnitOfWork);

    await useCase.execute({
      walletId: 'wallet-123',
      amount: '150.50',
      currency: 'BRL',
    });

    expect(existingWallet.currentBalance.amount).toBe('150.50');
    expect(updateCalled).toBe(true);
    expect(commitCalled).toBe(true);
  });

  it('should throw WalletNotFoundError if wallet does not exist', async () => {
    const mockWalletRepository: WalletRepository = {
      findById: mock(async () => null),
      add: mock(async () => {}),
      update: mock(async () => {}),
    };

    const mockUnitOfWork: UnitOfWork = {
      commit: mock(async () => {}),
    };

    const useCase = new CreditWalletUseCase(mockWalletRepository, mockUnitOfWork);

    const promise = useCase.execute({
      walletId: 'non-existent',
      amount: '50.00',
      currency: 'BRL',
    });

    await expect(promise).rejects.toThrow(WalletNotFoundError);
  });
});