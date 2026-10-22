import { DomainError } from './domain.error';

export class LedgerEntryBalanceInconsistentError extends DomainError {
  constructor(entryId: string) {
    super(`Ledger entry with ID "${entryId}" has inconsistent balance.`);
  }
}
