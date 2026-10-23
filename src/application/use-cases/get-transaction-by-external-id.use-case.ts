import { Inject, Injectable } from "@nestjs/common";
import { TransactionNotFoundError } from "src/domain/errors/transaction-not-found-error";
import { WagerTransaction } from "../../domain/wager/wager-transaction.aggregate";
import type { WagerTransactionRepository } from "../ports/wager-transaction.repository";

export interface GetTransactionByExternalIdQuery {
  providerId: string;
  externalTransactionId: string;
}

@Injectable()
export class GetTransactionByExternalIdUseCase {
  constructor(
    @Inject("WagerTransactionRepository")
    private readonly wagerTransactionRepository: WagerTransactionRepository,
  ) {}

  public async execute(
    query: GetTransactionByExternalIdQuery,
  ): Promise<WagerTransaction> {
    const transaction =
      await this.wagerTransactionRepository.findByProviderAndExternalId(
        query.providerId,
        query.externalTransactionId,
      );

    if (!transaction) {
      throw new TransactionNotFoundError(
        query.providerId,
        query.externalTransactionId,
      );
    }

    return transaction;
  }
}
