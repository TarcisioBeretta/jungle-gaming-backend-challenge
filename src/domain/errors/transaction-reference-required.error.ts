import { DomainError } from "./domain.error";

export class TransactionReferenceRequiredError extends DomainError {
  constructor(kind: string) {
    super(`Transaction of kind "${kind}" requires a reference transaction ID.`);
  }
}