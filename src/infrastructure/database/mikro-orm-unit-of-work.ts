import { EntityManager } from '@mikro-orm/core';
import { UnitOfWork } from '../../application/ports/unit-of-work.interface';

export class MikroOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly em: EntityManager) {}

  async commit(): Promise<void> {
    await this.em.flush();
  }
}
