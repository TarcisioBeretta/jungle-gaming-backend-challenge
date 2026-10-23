import { Inject, Injectable } from "@nestjs/common";
import type { WagerTransactionRepository } from "../ports/wager-transaction.repository";
import type { WalletRepository } from "../ports/wallet.repository";
import type { UnitOfWork } from "../ports/unit-of-work.interface";
import type { WagerTransactionIdempotencyServicePort } from "../ports/wager-transaction-idempotency.service";
import { WagerTransaction } from "../../domain/wager/wager-transaction.aggregate";
import { WagerTransactionKind } from "../../domain/wager/wager-transaction-kind.enum";
import { Money } from "../../domain/value-objects/money.value-object";
import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";

export interface ProcessLossCommand {
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
}

@Injectable()
export class ProcessLossUseCase {
  constructor(
    @Inject("WagerTransactionRepository")
    private readonly wagerTransactionRepository: WagerTransactionRepository,
    @Inject("WalletRepository")
    private readonly walletRepository: WalletRepository,
    @Inject("UnitOfWork")
    private readonly unitOfWork: UnitOfWork,
    @Inject("WagerTransactionIdempotencyServicePort")
    private readonly idempotencyService: WagerTransactionIdempotencyServicePort,
  ) {}

  public async execute(command: ProcessLossCommand): Promise<WagerTransaction> {
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

    const wagerTransaction = WagerTransaction.create({
      providerId: command.providerId,
      externalTransactionId: command.externalTransactionId,
      idempotencyKey: command.idempotencyKey,
      payloadHash: command.payloadHash,
      walletId: command.walletId,
      playerId: command.playerId,
      roundId: command.roundId,
      gameId: command.gameId,
      kind: WagerTransactionKind.Loss,
      money,
    });

    wagerTransaction.markProcessed();

    await this.wagerTransactionRepository.add(wagerTransaction);
    await this.unitOfWork.commit();

    return wagerTransaction;
  }
}
