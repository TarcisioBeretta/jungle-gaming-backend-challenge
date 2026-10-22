import { WalletLedgerEntry } from '../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerRepository } from '../ports/wallet-ledger.repository';

export interface GetWalletLedgerQuery {
  walletId: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedLedgerResult {
  entries: WalletLedgerEntry[];
  nextCursor?: string;
}

export class GetWalletLedgerUseCase {
  constructor(private readonly ledgerRepository: WalletLedgerRepository) {}

  public async execute(query: GetWalletLedgerQuery): Promise<PaginatedLedgerResult> {
    const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 50;

    const entries = await this.ledgerRepository.findByWalletIdPaginated(
      query.walletId,
      query.cursor,
      limit + 1,
    );

    let nextCursor: string | undefined = undefined;

    if (entries.length > limit) {
      const nextItem = entries.pop();
      nextCursor = nextItem?.id;
    }

    return {
      entries,
      nextCursor,
    };
  }
}