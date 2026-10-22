import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { Money } from '../../domain/value-objects/money.value-object';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WalletRepository } from '../ports/wallet.repository';
import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';

export interface CreateWalletCommand {
  playerId: string;
  currency: string;
  initialBalance?: {
    amount: string;
    currency: string;
  };
}

export class CreateWalletUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly wagerTransactionRepository: WagerTransactionRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(command: CreateWalletCommand): Promise<Wallet> {
    const wallet = Wallet.create({
      playerId: command.playerId,
      currency: command.currency,
    });

    if (command.initialBalance) {
      const initialMoney = Money.from(command.initialBalance);
      
      if (!initialMoney.isZero()) {
        wallet.credit(initialMoney);

        const openingTransaction = WagerTransaction.create({
          providerId: 'system',
          externalTransactionId: `opening-${wallet.id}`,
          idempotencyKey: `system:opening:${wallet.id}`,
          payloadHash: 'system-opening',
          walletId: wallet.id,
          playerId: wallet.playerId,
          roundId: `opening-round-${wallet.id}`,
          gameId: 'system-wallet-creation',
          kind: WagerTransactionKind.Opening,
          money: initialMoney,
        });

        openingTransaction.markProcessed();
        await this.wagerTransactionRepository.add(openingTransaction);
      }
    }

    await this.walletRepository.add(wallet);

    await this.unitOfWork.commit();

    return wallet;
  }
}