import { InboxMessage } from '../../domain/inbox/inbox-message.entity';

export interface InboxRepository {
  findByConsumerAndMessageId(consumerName: string, messageId: string): Promise<InboxMessage | null>;
  add(message: InboxMessage): Promise<void>;
  update(message: InboxMessage): Promise<void>;
}
