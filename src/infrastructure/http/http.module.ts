import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WagerTransactionIdempotencyService } from '../../application/services/wager-transaction-idempotency.service';
import { CreateWalletUseCase } from '../../application/use-cases/create-wallet.use-case';
import { GetTransactionByExternalIdUseCase } from '../../application/use-cases/get-transaction-by-external-id.use-case';
import { GetWalletLedgerUseCase } from '../../application/use-cases/get-wallet-ledger.use-case';
import { GetWalletUseCase } from '../../application/use-cases/get-wallet.use-case';
import { GetWagerTransactionByIdUseCase } from '../../application/use-cases/get-wager-transaction-by-id.use-case';
import { ProcessBetUseCase } from '../../application/use-cases/process-bet.use-case';
import { ProcessLossUseCase } from '../../application/use-cases/process-loss.use-case';
import { ProcessRefundUseCase } from '../../application/use-cases/process-refund.use-case';
import { ProcessRollbackUseCase } from '../../application/use-cases/process-rollback.use-case';
import { ProcessWinUseCase } from '../../application/use-cases/process-win.use-case';
import { ReconcileWalletUseCase } from '../../application/use-cases/reconcile-wallet.use-case';
import { HealthController } from './controllers/health.controller';
import { ProviderController } from './controllers/provider.controller';
import { WageringController } from './controllers/wagering.controller';
import { WalletController } from './controllers/wallet.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [WalletController, WageringController, ProviderController, HealthController],
  providers: [
    CreateWalletUseCase,
    GetWalletUseCase,
    GetWalletLedgerUseCase,
    GetWagerTransactionByIdUseCase,
    GetTransactionByExternalIdUseCase,
    ProcessBetUseCase,
    ProcessWinUseCase,
    ProcessLossUseCase,
    ProcessRefundUseCase,
    ProcessRollbackUseCase,
    ReconcileWalletUseCase,
    {
      provide: 'WagerTransactionIdempotencyServicePort',
      useClass: WagerTransactionIdempotencyService,
    },
  ],
})
export class HttpModule {}
