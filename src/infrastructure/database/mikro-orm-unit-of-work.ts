import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import type { UnitOfWork } from "../../application/ports/unit-of-work.interface";

@Injectable()
export class MikroOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly em: EntityManager) {}

  async commit(): Promise<void> {
    await this.em.flush();
  }
}
