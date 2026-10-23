import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateWalletUseCase } from '../../../application/use-cases/create-wallet.use-case';
import { GetWalletLedgerUseCase } from '../../../application/use-cases/get-wallet-ledger.use-case';
import { GetWalletUseCase } from '../../../application/use-cases/get-wallet.use-case';
import { ReconcileWalletUseCase } from '../../../application/use-cases/reconcile-wallet.use-case';
import { CreateWalletDto } from '../dtos/create-wallet.dto';
import { LedgerEntryResponseDto } from '../dtos/ledger-entry-response.dto';
import { WalletResponseDto } from '../dtos/wallet-response.dto';

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase,
    private readonly getWalletLedgerUseCase: GetWalletLedgerUseCase,
    private readonly reconcileWalletUseCase: ReconcileWalletUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateWalletDto): Promise<WalletResponseDto> {
    const wallet = await this.createWalletUseCase.execute({
      playerId: dto.playerId,
      currency: dto.currency,
      initialBalance: dto.initialBalance,
    });

    return WalletResponseDto.fromDomain(wallet);
  }

  @Get(':walletId')
  async findOne(@Param('walletId') walletId: string): Promise<WalletResponseDto> {
    const wallet = await this.getWalletUseCase.execute({ walletId });
    return WalletResponseDto.fromDomain(wallet);
  }

  @Get(':walletId/ledger')
  async ledger(
    @Param('walletId') walletId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<{ entries: LedgerEntryResponseDto[]; nextCursor?: string }> {
    const parsedLimit = limit ? Number(limit) : undefined;
    const result = await this.getWalletLedgerUseCase.execute({
      walletId,
      cursor,
      limit: parsedLimit,
    });

    return {
      entries: result.entries.map((entry) => LedgerEntryResponseDto.fromDomain(entry)),
      nextCursor: result.nextCursor,
    };
  }

  @Post(':walletId/reconciliation')
  async reconcile(@Param('walletId') walletId: string): Promise<{
    walletId: string;
    storedBalance: { amount: string; currency: string };
    calculatedBalance: { amount: string; currency: string };
    difference: { amount: string; currency: string };
    consistent: boolean;
    checkedEntries: number;
  }> {
    return this.reconcileWalletUseCase.execute({ walletId });
  }
}
