import { DomainError } from './domain.error';

export class IdempotencyKeyConflictError extends DomainError {
  constructor(idempotencyKey: string) {
    super(`Idempotency key "${idempotencyKey}" was already used with a different payload.`);
  }
}
