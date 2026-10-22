import { WagerTransactionRepository } from '../ports/wager-transaction.repository';
import { WagerTransaction } from '../../domain/wager/wager-transaction.aggregate';

export interface GetWagerTransactionByIdQuery {
  id: string;
}

export class GetWagerTransactionByIdUseCase {
  constructor(
    private readonly wagerTransactionRepository: WagerTransactionRepository,
  ) {}

  public async execute(query: GetWagerTransactionByIdQuery): Promise<WagerTransaction | null> {
    return this.wagerTransactionRepository.findById(query.id);
  }
}