
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Wallet } from '../../../domain/wallet/wallet.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';

@Entity({ tableName: 'wallets' })
export class WalletEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'player_id', type: 'string' })
  playerId!: string;

  @Property({ type: 'string' })
  currency!: string;

  @Property({ fieldName: 'balance_amount', type: 'string' })
  balanceAmount!: string;

  @Property({ fieldName: 'balance_currency', type: 'string' })
  balanceCurrency!: string;

  @Property({ type: 'number' })
  version!: number;

  @Property({ fieldName: 'created_at', type: 'Date' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', type: 'Date' })
  updatedAt!: Date;

  static fromDomain(wallet: Wallet): WalletEntity {
    const entity = new WalletEntity();
    entity.applyFromDomain(wallet);
    return entity;
  }

  applyFromDomain(wallet: Wallet): void {
    this.id = wallet.id;
    this.playerId = wallet.playerId;
    this.currency = wallet.currency;
    this.balanceAmount = wallet.balance.amount;
    this.balanceCurrency = wallet.balance.currency;
    this.version = wallet.version;
    this.createdAt = wallet.createdAt;
    this.updatedAt = wallet.updatedAt;
  }

  toDomain(): Wallet {
    return Wallet.restore(
      this.id,
      this.playerId,
      this.currency,
      Money.from({
        amount: this.balanceAmount,
        currency: this.balanceCurrency,
      }),
      this.version,
      this.createdAt,
      this.updatedAt,
    );
  }
}
