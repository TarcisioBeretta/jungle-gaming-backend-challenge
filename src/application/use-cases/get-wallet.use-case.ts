import { Inject, Injectable } from "@nestjs/common";
import { WalletNotFoundError } from "src/domain/errors/wallet-not-found.error";
import { Wallet } from "../../domain/wallet/wallet.aggregate";
import type { WalletRepository } from "../ports/wallet.repository";

export interface GetWalletQuery {
  walletId: string;
}

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject("WalletRepository")
    private readonly walletRepository: WalletRepository,
  ) {}

  public async execute(query: GetWalletQuery): Promise<Wallet> {
    const wallet = await this.walletRepository.findById(query.walletId);

    if (!wallet) {
      throw new WalletNotFoundError(query.walletId);
    }

    return wallet;
  }
}
