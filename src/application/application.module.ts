import { Module } from "@nestjs/common";
import { DatabaseModule } from "../infrastructure/database/database.module";
import { WagerTransactionIdempotencyService } from "./services/wager-transaction-idempotency.service";
import { CreateWalletUseCase } from "./use-cases/create-wallet.use-case";
import { GetWalletUseCase } from "./use-cases/get-wallet.use-case";
import { GetWalletLedgerUseCase } from "./use-cases/get-wallet-ledger.use-case";
import { GetWagerTransactionByIdUseCase } from "./use-cases/get-wager-transaction-by-id.use-case";
import { GetTransactionByExternalIdUseCase } from "./use-cases/get-transaction-by-external-id.use-case";
import { ProcessBetUseCase } from "./use-cases/process-bet.use-case";
import { ProcessWinUseCase } from "./use-cases/process-win.use-case";
import { ProcessLossUseCase } from "./use-cases/process-loss.use-case";
import { ProcessRefundUseCase } from "./use-cases/process-refund.use-case";
import { ProcessRollbackUseCase } from "./use-cases/process-rollback.use-case";
import { ReconcileWalletUseCase } from "./use-cases/reconcile-wallet.use-case";

@Module({
  imports: [DatabaseModule],
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
      provide: "WagerTransactionIdempotencyServicePort",
      useClass: WagerTransactionIdempotencyService,
    },
  ],
  exports: [
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
    "WagerTransactionIdempotencyServicePort",
  ],
})
export class ApplicationModule {}
