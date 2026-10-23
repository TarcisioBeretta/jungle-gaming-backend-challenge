import { defineConfig } from '@mikro-orm/postgresql';
import { WalletEntity } from './entities/wallet.entity';
import { WagerTransactionEntity } from './entities/wager-transaction.entity';
import { WalletLedgerEntryEntity } from './entities/wallet-ledger-entry.entity';
import { InboxMessageEntity } from './entities/inbox-message.entity';
import { OutboxMessageEntity } from './entities/outbox-message.entity';

export default defineConfig({
  entities: [
    WalletEntity,
    WagerTransactionEntity,
    WalletLedgerEntryEntity,
    InboxMessageEntity,
    OutboxMessageEntity,
  ],
  dbName: process.env.POSTGRES_DB ?? 'wagering_db',
  user: process.env.POSTGRES_USER ?? 'wagering_user',
  password: process.env.POSTGRES_PASSWORD ?? 'wagering_pass',
  host: process.env.POSTGRES_HOST ?? 'postgres',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  debug: process.env.NODE_ENV !== 'production',
  migrations: {
    path: 'src/infrastructure/database/migrations',
    pathTs: 'src/infrastructure/database/migrations',
  },
  forceUtcTimezone: true,
  allowGlobalContext: true,
});
