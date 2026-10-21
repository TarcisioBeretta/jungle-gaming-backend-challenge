import { DomainError } from "./domain.error";

export class NegativeMoneyError extends DomainError {
  constructor(amount: string) {
    super(`Money amount cannot be negative in this context: "${amount}".`);
  }
}
