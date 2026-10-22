import { TransactionNotFoundError } from 'src/domain/errors/transaction-not-found-error';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';
import { WagerTransactionRepository } from '../ports/wager-transaction.repository';

export interface GetTransactionByExternalIdQuery {
  providerId: string;
  externalTransactionId: string;
}

export class GetTransactionByExternalIdUseCase {
  constructor(private readonly wagerTransactionRepository: WagerTransactionRepository) {}

  public async execute(query: GetTransactionByExternalIdQuery): Promise<WagerTransaction> {
    const transaction = await this.wagerTransactionRepository.findByProviderAndExternalId(
      query.providerId,
      query.externalTransactionId,
    );

    if (!transaction) {
      throw new TransactionNotFoundError(query.providerId, query.externalTransactionId);
    }

    return transaction;
  }
}