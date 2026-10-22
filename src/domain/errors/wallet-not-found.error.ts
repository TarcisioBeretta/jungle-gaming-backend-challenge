import { DomainError } from "./domain.error";

export class WalletNotFoundError extends DomainError {
  constructor(walletId: string) {
    super(`Wallet with ID "${walletId}" was not found.`);
  }
}
