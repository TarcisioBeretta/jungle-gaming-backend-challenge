import { DomainError } from "./domain.error";

export class InvalidMoneyAmountError extends DomainError {
  constructor(amount: string) {
    super(
      `Invalid money amount format: "${amount}". Must be a decimal string with up to 2 decimal places.`,
    );
  }
}
