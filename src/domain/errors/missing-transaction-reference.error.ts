import { DomainError } from "./domain.error";

export class MissingTransactionReferenceError extends DomainError {
  constructor(transactionId: string) {
    super(
      `Transaction "${transactionId}" requires a reference transaction ID but none was provided.`,
    );
  }
}