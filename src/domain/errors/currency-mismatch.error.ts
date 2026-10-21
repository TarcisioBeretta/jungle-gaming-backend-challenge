import { DomainError } from "./domain.error";

export class CurrencyMismatchError extends DomainError {
  constructor(currencyA: string, currencyB: string) {
    super(
      `Currency mismatch: cannot perform operation between "${currencyA}" and "${currencyB}".`,
    );
  }
}
