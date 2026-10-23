import { EntityManager } from '@mikro-orm/core';
import { InboxRepository } from '../../../application/ports/inbox.repository';
import { InboxMessage } from '../../../domain/inbox/inbox-message.entity';
import { InboxMessageEntity } from '../entities/inbox-message.entity';

export class MikroOrmInboxRepository implements InboxRepository {
  constructor(private readonly em: EntityManager) {}

  async findByConsumerAndMessageId(
    consumerName: string,
    messageId: string,
  ): Promise<InboxMessage | null> {
    const entity = await this.em.findOne(InboxMessageEntity, {
      consumerName,
      messageId,
    });

    return entity ? entity.toDomain() : null;
  }

  async add(message: InboxMessage): Promise<void> {
    const entity = InboxMessageEntity.fromDomain(message);
    this.em.persist(entity);
  }

  async update(message: InboxMessage): Promise<void> {
    const existing = await this.em.findOne(InboxMessageEntity, { id: message.id });

    if (!existing) {
      return;
    }

    existing.applyFromDomain(message);
    this.em.persist(existing);
  }
}
