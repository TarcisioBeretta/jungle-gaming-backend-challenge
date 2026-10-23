import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { MikroOrmInboxRepository } from "./repositories/mikro-orm-inbox.repository";
import { MikroOrmOutboxRepository } from "./repositories/mikro-orm-outbox.repository";
import { MikroOrmUnitOfWork } from "./mikro-orm-unit-of-work";
import { MikroOrmWalletLedgerRepository } from "./repositories/mikro-orm-wallet-ledger.repository";
import { MikroOrmWalletRepository } from "./repositories/mikro-orm-wallet.repository";
import { MikroOrmWagerTransactionRepository } from "./repositories/mikro-orm-wager-transaction.repository";
import { WalletEntity } from "./entities/wallet.entity";
import { WagerTransactionEntity } from "./entities/wager-transaction.entity";
import { WalletLedgerEntryEntity } from "./entities/wallet-ledger-entry.entity";
import { InboxMessageEntity } from "./entities/inbox-message.entity";
import { OutboxMessageEntity } from "./entities/outbox-message.entity";
import ormConfig from "./mikro-orm.config";

@Module({
  imports: [
    MikroOrmModule.forRoot(ormConfig),
    MikroOrmModule.forFeature([
      WalletEntity,
      WagerTransactionEntity,
      WalletLedgerEntryEntity,
      InboxMessageEntity,
      OutboxMessageEntity,
    ]),
  ],
  providers: [
    { provide: "WalletRepository", useClass: MikroOrmWalletRepository },
    { provide: "WagerTransactionRepository", useClass: MikroOrmWagerTransactionRepository },
    { provide: "WalletLedgerRepository", useClass: MikroOrmWalletLedgerRepository },
    { provide: "InboxRepository", useClass: MikroOrmInboxRepository },
    { provide: "OutboxRepository", useClass: MikroOrmOutboxRepository },
    { provide: "UnitOfWork", useClass: MikroOrmUnitOfWork },
  ],
  exports: [
    "WalletRepository",
    "WagerTransactionRepository",
    "WalletLedgerRepository",
    "InboxRepository",
    "OutboxRepository",
    "UnitOfWork",
  ],
})
export class DatabaseModule {}
