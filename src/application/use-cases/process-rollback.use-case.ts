import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WalletRepository } from '../ports/wallet.repository';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { Wallet } from '../../domain/wallet/wallet.aggregate';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';
import { OriginalTransactionNotFoundError } from '../../domain/errors/original-transaction-not-found.error';

export interface ProcessRollbackCommand {
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  amount: string;
  currency: string;
  referenceExternalTransactionId: string;
}

interface RollbackStrategy {
  ledgerKind: WalletLedgerEntryKind | null;
  updateWallet: (wallet: Wallet, money: Money) => void;
  shouldUpdateWallet: boolean;
}

export class ProcessRollbackUseCase {
  private static readonly ROLLBACK_STRATEGIES: Record<WagerTransactionKind, RollbackStrategy> = {
    [WagerTransactionKind.Win]: {
      ledgerKind: WalletLedgerEntryKind.DEBIT,
      updateWallet: (wallet, money) => wallet.debit(money),
      shouldUpdateWallet: true,
    },
    [WagerTransactionKind.Refund]: {
      ledgerKind: WalletLedgerEntryKind.DEBIT,
      updateWallet: (wallet, money) => wallet.debit(money),
      shouldUpdateWallet: true,
    },
    [WagerTransactionKind.Opening]: {
      ledgerKind: WalletLedgerEntryKind.DEBIT,
      updateWallet: (wallet, money) => wallet.debit(money),
      shouldUpdateWallet: true,
    },
    [WagerTransactionKind.Bet]: {
      ledgerKind: WalletLedgerEntryKind.CREDIT,
      updateWallet: (wallet, money) => wallet.credit(money),
      shouldUpdateWallet: true,
    },
    [WagerTransactionKind.Loss]: {
      ledgerKind: null,
      updateWallet: () => {},
      shouldUpdateWallet: false,
    },
    [WagerTransactionKind.Rollback]: {
      ledgerKind: null,
      updateWallet: () => {},
      shouldUpdateWallet: false,
    },
  };

  constructor(
    private readonly wagerTransactionRepository: WagerTransactionRepository,
    private readonly walletRepository: WalletRepository,
    private readonly walletLedgerRepository: WalletLedgerRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(command: ProcessRollbackCommand): Promise<WagerTransaction> {
    const existingTransaction = await this.wagerTransactionRepository.findByIdempotencyKey(
      command.idempotencyKey,
    );

    if (existingTransaction) {
      return existingTransaction;
    }

    const wallet = await this.walletRepository.findById(command.walletId);
    if (!wallet) {
      throw new WalletNotFoundError(command.walletId);
    }

    const money = Money.from({
      amount: command.amount,
      currency: command.currency,
    });

    const originalTransaction = await this.wagerTransactionRepository.findByProviderAndExternalId(
      command.providerId,
      command.referenceExternalTransactionId,
    );

    if (!originalTransaction) {
      throw new OriginalTransactionNotFoundError(command.referenceExternalTransactionId);
    }

    const strategy = ProcessRollbackUseCase.ROLLBACK_STRATEGIES[originalTransaction.kind];

    const balanceBefore = wallet.balance;
    strategy.updateWallet(wallet, money);
    const balanceAfter = wallet.balance;

    const wagerTransaction = WagerTransaction.create({
      providerId: command.providerId,
      externalTransactionId: command.externalTransactionId,
      idempotencyKey: command.idempotencyKey,
      payloadHash: command.payloadHash,
      walletId: command.walletId,
      playerId: command.playerId,
      roundId: command.roundId,
      gameId: command.gameId,
      kind: WagerTransactionKind.Rollback,
      money,
      referenceExternalTransactionId: command.referenceExternalTransactionId,
    });

    wagerTransaction.markProcessedWithReference(command.referenceExternalTransactionId);

    await this.wagerTransactionRepository.add(wagerTransaction);

    if (strategy.ledgerKind) {
      const ledgerEntry = WalletLedgerEntry.create({
        walletId: wallet.id,
        transactionId: wagerTransaction.id,
        kind: strategy.ledgerKind,
        money,
        balanceBefore,
        balanceAfter,
      });
      await this.walletLedgerRepository.add(ledgerEntry);
    }

    if (strategy.shouldUpdateWallet) {
      await this.walletRepository.update(wallet);
    }

    await this.unitOfWork.commit();

    return wagerTransaction;
  }
}