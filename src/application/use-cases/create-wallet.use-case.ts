import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { Money } from '../../domain/value-objects/money.value-object';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WalletRepository } from '../ports/wallet.repository';
import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';

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
    private readonly walletLedgerRepository: WalletLedgerRepository,
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
        const balanceBefore = wallet.balance;
        wallet.credit(initialMoney);
        const balanceAfter = wallet.balance;

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

        const ledgerEntry = WalletLedgerEntry.create({
          walletId: wallet.id,
          transactionId: openingTransaction.id,
          kind: WalletLedgerEntryKind.CREDIT,
          money: initialMoney,
          balanceBefore,
          balanceAfter,
        });

        await this.wagerTransactionRepository.add(openingTransaction);
        await this.walletLedgerRepository.add(ledgerEntry);
      }
    }

    await this.walletRepository.add(wallet);

    await this.unitOfWork.commit();

    return wallet;
  }
}