import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';

export interface WagerTransactionIdempotencyServicePort {
  ensureUnique(idempotencyKey: string, payloadHash: string): Promise<WagerTransaction | null>;
}
