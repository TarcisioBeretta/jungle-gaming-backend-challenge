import { Inject, Injectable } from "@nestjs/common";
import { WagerTransactionNotFoundError } from "../../domain/errors/wager-transaction-not-found.error";
import type { WagerTransactionRepository } from "../ports/wager-transaction.repository";
import { WagerTransaction } from "../../domain/wager/wager-transaction.aggregate";

export interface GetWagerTransactionByIdQuery {
  transactionId: string;
}

@Injectable()
export class GetWagerTransactionByIdUseCase {
  constructor(
    @Inject("WagerTransactionRepository")
    private readonly wagerTransactionRepository: WagerTransactionRepository,
  ) {}

  public async execute(
    query: GetWagerTransactionByIdQuery,
  ): Promise<WagerTransaction> {
    const transaction = await this.wagerTransactionRepository.findById(
      query.transactionId,
    );

    if (!transaction) {
      throw new WagerTransactionNotFoundError(query.transactionId);
    }

    return transaction;
  }
}
