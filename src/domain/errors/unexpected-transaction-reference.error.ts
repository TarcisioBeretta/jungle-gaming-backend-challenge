import { DomainError } from "./domain.error";

export class UnexpectedTransactionReferenceError extends DomainError {
  constructor(kind: string) {
    super(`Transaction of kind "${kind}" does not expect a reference transaction ID.`);
  }
}