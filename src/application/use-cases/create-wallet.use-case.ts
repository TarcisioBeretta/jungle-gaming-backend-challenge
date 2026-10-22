import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WalletRepository } from '../ports/wallet.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';

export interface CreateWalletCommand {
  id: string;
  userId: string;
  currency: string;
}

export class CreateWalletUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(command: CreateWalletCommand): Promise<void> {
    const wallet = Wallet.create({
      id: command.id,
      userId: command.userId,
      currency: command.currency,
    });

    await this.walletRepository.add(wallet);

    await this.unitOfWork.commit();
  }
}