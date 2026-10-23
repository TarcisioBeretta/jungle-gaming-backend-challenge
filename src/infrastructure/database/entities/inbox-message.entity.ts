import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { InboxMessage } from '../../../domain/inbox/inbox-message.entity';

@Entity({ tableName: 'inbox_messages' })
export class InboxMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'message_id', type: 'string' })
  messageId!: string;

  @Property({ fieldName: 'consumer_name', type: 'string' })
  consumerName!: string;

  @Property({ fieldName: 'payload_hash', type: 'string' })
  payloadHash!: string;

  @Property({ fieldName: 'payload', type: 'json', nullable: true })
  payload?: Record<string, unknown>;

  @Property({ fieldName: 'received_at', type: 'Date' })
  receivedAt!: Date;

  @Property({ fieldName: 'processed_at', type: 'Date', nullable: true })
  processedAt?: Date;

  static fromDomain(message: InboxMessage): InboxMessageEntity {
    const entity = new InboxMessageEntity();
    entity.applyFromDomain(message);
    return entity;
  }

  applyFromDomain(message: InboxMessage): void {
    this.id = message.id;
    this.messageId = message.messageId;
    this.consumerName = message.consumerName;
    this.payloadHash = message.payloadHash;
    this.payload = message.payload;
    this.receivedAt = message.receivedAt;
    this.processedAt = message.processedAt;
  }

  toDomain(): InboxMessage {
    return InboxMessage.restore(
      this.id,
      this.messageId,
      this.consumerName,
      this.payloadHash,
      this.payload,
      this.receivedAt,
      this.processedAt,
    );
  }
}
