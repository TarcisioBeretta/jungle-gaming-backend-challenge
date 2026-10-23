import { Controller, Get, Param } from '@nestjs/common';
import { GetTransactionByExternalIdUseCase } from '../../../application/use-cases/get-transaction-by-external-id.use-case';
import { TransactionResponseDto } from '../dtos/transaction-response.dto';

@Controller('providers')
export class ProviderController {
  constructor(
    private readonly getTransactionByExternalIdUseCase: GetTransactionByExternalIdUseCase,
  ) {}

  @Get(':providerId/wagering/transactions/:externalTransactionId')
  async findByExternalId(
    @Param('providerId') providerId: string,
    @Param('externalTransactionId') externalTransactionId: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.getTransactionByExternalIdUseCase.execute({
      providerId,
      externalTransactionId,
    });

    return TransactionResponseDto.fromDomain(transaction);
  }
}
