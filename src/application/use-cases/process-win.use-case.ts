import { Inject, Injectable } from "@nestjs/common";
import type { WagerTransactionRepository } from "../ports/wager-transaction.repository";
import type { WalletRepository } from "../ports/wallet.repository";
import type { WalletLedgerRepository } from "../ports/wallet-ledger.repository";
import type { OutboxRepository } from "../ports/outbox.repository";
import type { UnitOfWork } from "../ports/unit-of-work.interface";
import type { WagerTransactionIdempotencyServicePort } from "../ports/wager-transaction-idempotency.service";
import { WagerTransaction } from "../../domain/wager/wager-transaction.aggregate";
import { WagerTransactionKind } from "../../domain/wager/wager-transaction-kind.enum";
import { WalletLedgerEntry } from "../../domain/ledger/wallet-ledger-entry.entity";
import { WalletLedgerEntryKind } from "../../domain/ledger/wallet-ledger-entry-kind.enum";
import { Money } from "../../domain/value-objects/money.value-object";
import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";
import { OutboxMessage } from "../../domain/outbox/outbox-message.entity";
import { WagerTransactionProcessed } from "../../domain/events/wager-transaction-processed.event";
import { WalletBalanceChanged } from "../../domain/events/wallet-balance-changed.event";

export interface ProcessWinCommand {
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
export class ProcessWinUseCase {
  constructor(
    @Inject("WagerTransactionRepository")
    private readonly wagerTransactionRepository: WagerTransactionRepository,
    @Inject("WalletRepository")
    private readonly walletRepository: WalletRepository,
    @Inject("WalletLedgerRepository")
    private readonly walletLedgerRepository: WalletLedgerRepository,
    @Inject("OutboxRepository")
    private readonly outboxRepository: OutboxRepository,
    @Inject("UnitOfWork")
    private readonly unitOfWork: UnitOfWork,
    @Inject("WagerTransactionIdempotencyServicePort")
    private readonly idempotencyService: WagerTransactionIdempotencyServicePort,
  ) {}

  public async execute(command: ProcessWinCommand): Promise<WagerTransaction> {
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
      kind: WagerTransactionKind.Win,
      money,
    });

    wagerTransaction.markProcessed();

    const ledgerEntry = WalletLedgerEntry.create({
      walletId: wallet.id,
      transactionId: wagerTransaction.id,
      kind: WalletLedgerEntryKind.CREDIT,
      money,
      balanceBefore,
      balanceAfter,
    });

    const correlationId = command.idempotencyKey;

    const transactionProcessedEvent = WagerTransactionProcessed.from(
      wagerTransaction,
      { correlationId },
    );

    const balanceChangedEvent = WalletBalanceChanged.from(
      wallet,
      ledgerEntry,
      { correlationId },
    );

    const outboxProcessedMessage = OutboxMessage.create({
      aggregateId: transactionProcessedEvent.aggregateId,
      eventType: transactionProcessedEvent.eventType,
      payload: transactionProcessedEvent.toJSON(),
    });

    const outboxBalanceMessage = OutboxMessage.create({
      aggregateId: balanceChangedEvent.aggregateId,
      eventType: balanceChangedEvent.eventType,
      payload: balanceChangedEvent.toJSON(),
    });

    await this.wagerTransactionRepository.add(wagerTransaction);
    await this.walletLedgerRepository.add(ledgerEntry);
    await this.walletRepository.update(wallet);
    await this.outboxRepository.add(outboxProcessedMessage);
    await this.outboxRepository.add(outboxBalanceMessage);
    
    await this.unitOfWork.commit();

    return wagerTransaction;
  }
}
