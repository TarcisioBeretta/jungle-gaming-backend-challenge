import { OutboxMessage } from '../../domain/outbox/outbox-message.entity';

export interface OutboxRepository {
  add(message: OutboxMessage): Promise<void>;
  findPending(limit?: number): Promise<OutboxMessage[]>;
  update(message: OutboxMessage): Promise<void>;
}
