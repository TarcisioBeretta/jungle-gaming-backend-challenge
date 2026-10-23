import { IdempotencyKeyConflictError } from "../../domain/errors/idempotency-key-conflict.error";
import { WagerTransaction } from "../../domain/wager/wager-transaction.aggregate";
import { WagerTransactionIdempotencyServicePort } from "../ports/wager-transaction-idempotency.service";
import { WagerTransactionRepository } from "../ports/wager-transaction.repository";

export class WagerTransactionIdempotencyService implements WagerTransactionIdempotencyServicePort {
  constructor(
    private readonly wagerTransactionRepository: WagerTransactionRepository,
  ) {}

  async ensureUnique(
    idempotencyKey: string,
    payloadHash: string,
  ): Promise<WagerTransaction | null> {
    const existing =
      await this.wagerTransactionRepository.findByIdempotencyKey(
        idempotencyKey,
      );

    if (!existing) {
      return null;
    }

    if (!existing.matchesPayload(payloadHash)) {
      throw new IdempotencyKeyConflictError(idempotencyKey);
    }

    return existing;
  }
}
