import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import type { OutboxRepository } from "../../../application/ports/outbox.repository";
import { OutboxMessage } from "../../../domain/outbox/outbox-message.entity";
import { OutboxMessageEntity } from "../entities/outbox-message.entity";

@Injectable()
export class MikroOrmOutboxRepository implements OutboxRepository {
  constructor(private readonly em: EntityManager) {}

  async add(message: OutboxMessage): Promise<void> {
    const entity = OutboxMessageEntity.fromDomain(message);
    this.em.persist(entity);
  }

  async findPending(limit = 20): Promise<OutboxMessage[]> {
    const now = new Date();

    const entities = await this.em.find(
      OutboxMessageEntity,
      {
        publishedAt: null,
        $or: [
          { nextAttemptAt: { $lte: now } },
          { nextAttemptAt: undefined },
        ],
      },
      {
        orderBy: { occurredAt: "ASC" },
        limit,
      },
    );

    return entities.map((entity) => entity.toDomain());
  }

  async update(message: OutboxMessage): Promise<void> {
    const existing = await this.em.findOne(OutboxMessageEntity, {
      id: message.id,
    });

    if (!existing) {
      return;
    }

    existing.applyFromDomain(message);
    this.em.persist(existing);
  }
}
