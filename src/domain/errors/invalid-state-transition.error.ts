import { DomainError } from "./domain.error";
import { WagerTransactionStatus } from "../wager/wager-transaction-status.enum";

export class InvalidStateTransitionError extends DomainError {
  constructor(
    transactionId: string,
    fromState: WagerTransactionStatus,
    toState: WagerTransactionStatus,
  ) {
    super(
      `Cannot transition transaction "${transactionId}" from state "${fromState}" to "${toState}".`,
    );
  }
}