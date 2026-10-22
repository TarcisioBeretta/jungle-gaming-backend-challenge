import { DomainError } from "./domain.error";

export class TransactionNotFoundError extends DomainError {
  constructor(providerId: string, externalTransactionId: string) {
    super(
      `Transaction with providerId "${providerId}" and externalTransactionId "${externalTransactionId}" was not found.`,
    );
  }
}
