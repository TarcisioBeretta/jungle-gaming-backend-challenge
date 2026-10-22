import { DomainError } from "./domain.error";

export class WagerTransactionNotFoundError extends DomainError {
  constructor(transactionId: string) {
    super(`Wager transaction with ID "${transactionId}" was not found.`);
  }
}
