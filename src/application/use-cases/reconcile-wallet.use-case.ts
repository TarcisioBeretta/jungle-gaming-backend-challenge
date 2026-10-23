import { Inject, Injectable } from "@nestjs/common";
import type { WalletRepository } from "../ports/wallet.repository";
import type { WalletLedgerRepository } from "../ports/wallet-ledger.repository";
import { Money } from "../../domain/value-objects/money.value-object";
import { WalletLedgerEntryKind } from "../../domain/ledger/wallet-ledger-entry-kind.enum";
import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";

export interface ReconcileWalletInput {
  walletId: string;
}

export interface ReconcileWalletResult {
  walletId: string;
  storedBalance: { amount: string; currency: string };
  calculatedBalance: { amount: string; currency: string };
  difference: { amount: string; currency: string };
  consistent: boolean;
  checkedEntries: number;
}

@Injectable()
export class ReconcileWalletUseCase {
  constructor(
    @Inject("WalletRepository")
    private readonly walletRepository: WalletRepository,
    @Inject("WalletLedgerRepository")
    private readonly ledgerRepository: WalletLedgerRepository,
  ) {}

  public async execute(
    input: ReconcileWalletInput,
  ): Promise<ReconcileWalletResult> {
    const wallet = await this.walletRepository.findById(input.walletId);

    if (!wallet) {
      throw new WalletNotFoundError(input.walletId);
    }

    const entries = await this.ledgerRepository.findAllByWalletId(
      input.walletId,
    );

    let calculatedBalance = Money.zero(wallet.balance.currency);

    for (const entry of entries) {
      if (entry.kind === WalletLedgerEntryKind.CREDIT) {
        calculatedBalance = calculatedBalance.add(entry.money);
      } else if (entry.kind === WalletLedgerEntryKind.DEBIT) {
        calculatedBalance = calculatedBalance.subtract(entry.money);
      }
    }

    const storedBalance = wallet.balance;
    const consistent = calculatedBalance.equals(storedBalance);

    let difference: Money;
    if (consistent) {
      difference = Money.zero(wallet.balance.currency);
    } else {
      difference = calculatedBalance.subtract(storedBalance);
    }

    return {
      walletId: wallet.id,
      storedBalance: {
        amount: storedBalance.toString(),
        currency: storedBalance.currency,
      },
      calculatedBalance: {
        amount: calculatedBalance.toString(),
        currency: calculatedBalance.currency,
      },
      difference: {
        amount: difference.toString(),
        currency: difference.currency,
      },
      consistent,
      checkedEntries: entries.length,
    };
  }
}
