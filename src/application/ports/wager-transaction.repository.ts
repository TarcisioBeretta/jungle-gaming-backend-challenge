import { WagerTransaction } from "../../domain/wager/wager-transaction.aggregate";

export interface WagerTransactionRepository {
  findById(id: string): Promise<WagerTransaction | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<WagerTransaction | null>;
  findByProviderAndExternalId(providerId: string,externalTransactionId: string): Promise<WagerTransaction | null>;
  add(transaction: WagerTransaction): Promise<void>;
  update(transaction: WagerTransaction): Promise<void>;
}
