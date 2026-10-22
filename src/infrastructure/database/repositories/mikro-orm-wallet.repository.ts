import { EntityManager } from '@mikro-orm/core';
import { WalletRepository } from '../../../application/ports/wallet.repository';
import { WalletNotFoundError } from '../../../domain/errors/wallet-not-found.error';
import { Wallet } from '../../../domain/wallet/wallet.aggregate';
import { WalletEntity } from '../entities/wallet.entity';

export class MikroOrmWalletRepository implements WalletRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Wallet | null> {
    const entity = await this.em.findOne(WalletEntity, { id });
    return entity ? entity.toDomain() : null;
  }

  async add(wallet: Wallet): Promise<void> {
    const entity = WalletEntity.fromDomain(wallet);
    this.em.persist(entity);
  }

  async update(wallet: Wallet): Promise<void> {
    const existing = await this.em.findOne(WalletEntity, { id: wallet.id });

    if (!existing) {
      throw new WalletNotFoundError(wallet.id);
    }

    existing.applyFromDomain(wallet);
    this.em.persist(existing);
  }
}
