import { DomainError } from "./domain.error";

export class OriginalTransactionNotFoundError extends DomainError {
  constructor(referenceExternalTransactionId: string) {
    super(`Original transaction with reference external ID '${referenceExternalTransactionId}' not found.`);
  }
}