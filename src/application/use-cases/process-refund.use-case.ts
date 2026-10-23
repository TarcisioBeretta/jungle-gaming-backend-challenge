import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WalletRepository } from '../ports/wallet.repository';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { WagerTransactionIdempotencyServicePort } from '../ports/wager-transaction-idempotency.service';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryKind } from '../../domain/ledger/wallet-ledger-entry-kind.enum';
import { Money } from '../../domain/value-objects/money.value-object';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

export interface ProcessRefundCommand {
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

export class ProcessRefundUseCase {
  constructor(
    private readonly wagerTransactionRepository: WagerTransactionRepository,
    private readonly walletRepository: WalletRepository,
    private readonly walletLedgerRepository: WalletLedgerRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly idempotencyService: WagerTransactionIdempotencyServicePort,
  ) {}

  public async execute(command: ProcessRefundCommand): Promise<WagerTransaction> {
    const existingTransaction = await this.idempotencyService.ensureUnique(
      command.idempotencyKey,
      command.payloadHash,
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

    const balanceBefore = wallet.balance;
    wallet.credit(money);
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
      kind: WagerTransactionKind.Refund,
      money,
      referenceExternalTransactionId: command.referenceExternalTransactionId,
    });

    wagerTransaction.markProcessedWithReference(command.referenceExternalTransactionId);

    const ledgerEntry = WalletLedgerEntry.create({
      walletId: wallet.id,
      transactionId: wagerTransaction.id,
      kind: WalletLedgerEntryKind.CREDIT,
      money,
      balanceBefore,
      balanceAfter,
    });

    await this.wagerTransactionRepository.add(wagerTransaction);
    await this.walletLedgerRepository.add(ledgerEntry);
    await this.walletRepository.update(wallet);
    await this.unitOfWork.commit();

    return wagerTransaction;
  }
}