import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { PayloadHash } from '../../../application/utils/payload-hash.util';
import { ProcessBetUseCase } from '../../../application/use-cases/process-bet.use-case';
import { ProcessLossUseCase } from '../../../application/use-cases/process-loss.use-case';
import { ProcessRefundUseCase } from '../../../application/use-cases/process-refund.use-case';
import { ProcessRollbackUseCase } from '../../../application/use-cases/process-rollback.use-case';
import { ProcessWinUseCase } from '../../../application/use-cases/process-win.use-case';
import { GetWagerTransactionByIdUseCase } from '../../../application/use-cases/get-wager-transaction-by-id.use-case';
import { WagerTransactionNotFoundError } from '../../../domain/errors/wager-transaction-not-found.error';
import { WagerTransaction } from '../../../domain/wager/wager-transaction.aggregate';
import { ProcessTransactionDto } from '../dtos/process-transaction.dto';
import { TransactionResponseDto } from '../dtos/transaction-response.dto';

type WagerTransactionCommandCommon = {
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  amount: string;
  currency: string;
};

@Controller('wagering')
export class WageringController {
  constructor(
    private readonly getWagerTransactionByIdUseCase: GetWagerTransactionByIdUseCase,
    private readonly processBetUseCase: ProcessBetUseCase,
    private readonly processWinUseCase: ProcessWinUseCase,
    private readonly processLossUseCase: ProcessLossUseCase,
    private readonly processRefundUseCase: ProcessRefundUseCase,
    private readonly processRollbackUseCase: ProcessRollbackUseCase,
  ) {}

  @Get('transactions/:transactionId')
  async findById(@Param('transactionId') transactionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.getWagerTransactionByIdUseCase.execute({ transactionId });

    if (!transaction) {
      throw new WagerTransactionNotFoundError(transactionId);
    }

    return TransactionResponseDto.fromDomain(transaction, false);
  }

  @Post('transactions')
  async process(
    @Body() dto: ProcessTransactionDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<TransactionResponseDto> {
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const kind = dto.kind.toUpperCase();
    const effectiveIdempotencyKey = idempotencyKey.trim();
    const common = this.buildCommonRequest(dto, kind, effectiveIdempotencyKey);
    const transaction = await this.executeByKind(kind, dto, common);

    return TransactionResponseDto.fromDomain(transaction, false);
  }

  private buildCommonRequest(
    dto: ProcessTransactionDto,
    kind: string,
    idempotencyKey: string,
  ): WagerTransactionCommandCommon {
    return {
      providerId: dto.providerId,
      externalTransactionId: dto.externalTransactionId,
      idempotencyKey,
      payloadHash: PayloadHash.from({
        providerId: dto.providerId,
        externalTransactionId: dto.externalTransactionId,
        walletId: dto.walletId,
        playerId: dto.playerId,
        roundId: dto.roundId,
        gameId: dto.gameId,
        kind,
        money: dto.money,
        referenceExternalTransactionId: dto.referenceExternalTransactionId,
      }),
      walletId: dto.walletId,
      playerId: dto.playerId,
      roundId: dto.roundId,
      gameId: dto.gameId,
      amount: dto.money.amount,
      currency: dto.money.currency,
    };
  }

  private async executeByKind(
    kind: string,
    dto: ProcessTransactionDto,
    common: WagerTransactionCommandCommon,
  ): Promise<WagerTransaction> {
    switch (kind) {
      case 'BET':
        return this.processBetUseCase.execute({ ...common });
      case 'WIN':
        return this.processWinUseCase.execute({ ...common });
      case 'LOSS':
        return this.processLossUseCase.execute({ ...common });
      case 'REFUND':
        return this.processRefundUseCase.execute({
          ...common,
          referenceExternalTransactionId: dto.referenceExternalTransactionId ?? '',
        });
      case 'ROLLBACK':
        return this.processRollbackUseCase.execute({
          ...common,
          referenceExternalTransactionId: dto.referenceExternalTransactionId ?? '',
        });
      default:
        throw new BadRequestException(`Unsupported transaction kind: ${kind}`);
    }
  }
}
