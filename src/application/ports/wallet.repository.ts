import { Wallet } from '../../domain/wallet/wallet.aggregate';

export interface WalletRepository {
  findById(id: string): Promise<Wallet | null>;
  add(wallet: Wallet): Promise<void>;
}