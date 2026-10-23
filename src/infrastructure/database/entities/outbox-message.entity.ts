import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { OutboxMessage } from '../../../domain/outbox/outbox-message.entity';

@Entity({ tableName: 'outbox_messages' })
export class OutboxMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'aggregate_id', type: 'string', nullable: true })
  aggregateId?: string;

  @Property({ fieldName: 'event_type', type: 'string' })
  eventType!: string;

  @Property({ fieldName: 'payload', type: 'json' })
  payload!: Record<string, unknown>;

  @Property({ fieldName: 'occurred_at', type: 'Date' })
  occurredAt!: Date;

  @Property({ fieldName: 'attempts', type: 'number' })
  attempts!: number;

  @Property({ fieldName: 'next_attempt_at', type: 'Date', nullable: true })
  nextAttemptAt?: Date;

  @Property({ fieldName: 'published_at', type: 'Date', nullable: true })
  publishedAt?: Date;

  static fromDomain(message: OutboxMessage): OutboxMessageEntity {
    const entity = new OutboxMessageEntity();
    entity.applyFromDomain(message);
    return entity;
  }

  applyFromDomain(message: OutboxMessage): void {
    this.id = message.id;
    this.aggregateId = message.aggregateId;
    this.eventType = message.eventType;
    this.payload = message.payload;
    this.occurredAt = message.occurredAt;
    this.attempts = message.attempts;
    this.nextAttemptAt = message.nextAttemptAt;
    this.publishedAt = message.publishedAt;
  }

  toDomain(): OutboxMessage {
    return OutboxMessage.restore(
      this.id,
      this.aggregateId,
      this.eventType,
      this.payload,
      this.occurredAt,
      this.attempts,
      this.nextAttemptAt,
      this.publishedAt,
    );
  }
}
