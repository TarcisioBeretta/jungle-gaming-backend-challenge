import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import type { WagerTransactionRepository } from "../../../application/ports/wager-transaction.repository";
import { WagerTransactionNotFoundError } from "../../../domain/errors/wager-transaction-not-found.error";
import { WagerTransaction } from "../../../domain/wager/wager-transaction.aggregate";
import { WagerTransactionEntity } from "../entities/wager-transaction.entity";

@Injectable()
export class MikroOrmWagerTransactionRepository implements WagerTransactionRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<WagerTransaction | null> {
    const entity = await this.em.findOne(WagerTransactionEntity, { id });
    return entity ? entity.toDomain() : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<WagerTransaction | null> {
    const entity = await this.em.findOne(WagerTransactionEntity, {
      idempotencyKey,
    });
    return entity ? entity.toDomain() : null;
  }

  async findByProviderAndExternalId(
    providerId: string,
    externalTransactionId: string,
  ): Promise<WagerTransaction | null> {
    const entity = await this.em.findOne(WagerTransactionEntity, {
      providerId,
      externalTransactionId,
    });

    return entity ? entity.toDomain() : null;
  }

  async add(transaction: WagerTransaction): Promise<void> {
    const entity = WagerTransactionEntity.fromDomain(transaction);
    this.em.persist(entity);
  }

  async update(transaction: WagerTransaction): Promise<void> {
    const existing = await this.em.findOne(WagerTransactionEntity, {
      id: transaction.id,
    });

    if (!existing) {
      throw new WagerTransactionNotFoundError(transaction.id);
    }

    existing.applyFromDomain(transaction);
    this.em.persist(existing);
  }
}
