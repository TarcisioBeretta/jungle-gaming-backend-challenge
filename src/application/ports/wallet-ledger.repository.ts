import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';

export interface WalletLedgerRepository {
  add(entry: WalletLedgerEntry): Promise<void>;
  findByWalletIdPaginated(walletId: string, cursor?: string, limit?: number): Promise<WalletLedgerEntry[]>;
  findAllByWalletId(walletId: string): Promise<WalletLedgerEntry[]>;
}