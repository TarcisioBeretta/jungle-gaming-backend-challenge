import { EntityManager } from '@mikro-orm/core';
import { WalletLedgerRepository } from '../../../application/ports/wallet-ledger.repository';
import { WalletLedgerEntry } from '../../../domain/ledger/wallet-ledger-entry.entity';
import { WalletLedgerEntryEntity } from '../entities/wallet-ledger-entry.entity';

export class MikroOrmWalletLedgerRepository implements WalletLedgerRepository {
  constructor(private readonly em: EntityManager) {}

  async add(entry: WalletLedgerEntry): Promise<void> {
    const entity = WalletLedgerEntryEntity.fromDomain(entry);
    this.em.persist(entity);
  }

  async findByWalletIdPaginated(
    walletId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<WalletLedgerEntry[]> {
    const query = {
      walletId,
      ...(cursor ? { id: { $lt: cursor } } : {}),
    };

    const entities = await this.em.find(WalletLedgerEntryEntity, query, {
      orderBy: { createdAt: 'DESC' },
      limit,
    });

    return entities.map((entity) => entity.toDomain());
  }

  async findAllByWalletId(walletId: string): Promise<WalletLedgerEntry[]> {
    const entities = await this.em.find(
      WalletLedgerEntryEntity,
      { walletId },
      { orderBy: { createdAt: 'DESC' } },
    );

    return entities.map((entity) => entity.toDomain());
  }
}
