import { DomainError } from "./domain.error";

export class InsufficientBalanceError extends DomainError {
  constructor(currentBalance: string, requestedAmount: string) {
    super(
      `Insufficient balance: current balance is ${currentBalance}, requested debit was ${requestedAmount}.`,
    );
  }
}
