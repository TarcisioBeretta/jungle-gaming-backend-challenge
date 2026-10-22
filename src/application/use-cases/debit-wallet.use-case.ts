import { WalletRepository } from "../ports/wallet.repository";
import { UnitOfWork } from "../ports/unit-of-work.interface";
import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";
import { Money } from "../../domain/wallet/money.value-object";

export interface DebitWalletCommand {
  walletId: string;
  amount: string;
  currency: string;
}

export class DebitWalletUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(command: DebitWalletCommand): Promise<void> {
    const wallet = await this.walletRepository.findById(command.walletId);

    if (!wallet) {
      throw new WalletNotFoundError(command.walletId);
    }

    const moneyToDebit = Money.from({
      amount: command.amount,
      currency: command.currency,
    });

    wallet.debit(moneyToDebit);

    await this.walletRepository.update(wallet);

    await this.unitOfWork.commit();
  }
}
