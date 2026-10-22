import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WalletRepository } from '../ports/wallet.repository';
import { UnitOfWork } from '../ports/unit-of-work.interface';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionKind } from '../../domain/wager/wager-transaction-kind.enum';
import { Money } from '../../domain/wallet/money.value-object';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

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

export class ProcessRollbackUseCase {
  constructor(
    private readonly wagerTransactionRepository: WagerTransactionRepository,
    private readonly walletRepository: WalletRepository,
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

    wallet.credit(money);

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
    await this.walletRepository.update(wallet);
    await this.unitOfWork.commit();

    return wagerTransaction;
  }
}