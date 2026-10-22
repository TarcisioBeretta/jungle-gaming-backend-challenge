import { InvalidStateTransitionError } from "../errors/invalid-state-transition.error";
import { MissingTransactionReferenceError } from "../errors/missing-transaction-reference.error";
import { TransactionReferenceRequiredError } from "../errors/transaction-reference-required.error";
import { UnexpectedTransactionReferenceError } from "../errors/unexpected-transaction-reference.error";
import { Money } from "../value-objects/money.value-object";
import { WagerTransactionKind } from "./wager-transaction-kind.enum";
import { WagerTransactionStatus } from "./wager-transaction-status.enum";

export interface CreateWagerTransactionProps {
  providerId: string;
  externalTransactionId: string;
  idempotencyKey: string;
  payloadHash: string;
  walletId: string;
  playerId: string;
  roundId: string;
  gameId: string;
  kind: WagerTransactionKind;
  money: Money;
  referenceExternalTransactionId?: string;
}

export class WagerTransaction {
  private static readonly ALLOWED_TRANSITIONS: Record<WagerTransactionStatus, WagerTransactionStatus[]> = {
    [WagerTransactionStatus.Pending]: [
      WagerTransactionStatus.Processed,
      WagerTransactionStatus.PendingReference,
      WagerTransactionStatus.Rejected,
      WagerTransactionStatus.Failed,
    ],
    [WagerTransactionStatus.PendingReference]: [
      WagerTransactionStatus.Processed,
      WagerTransactionStatus.Rejected,
      WagerTransactionStatus.Failed,
    ],
    [WagerTransactionStatus.Processed]: [],
    [WagerTransactionStatus.Rejected]: [],
    [WagerTransactionStatus.Failed]: [],
  };

  private constructor(
    public readonly id: string,
    public readonly providerId: string,
    public readonly externalTransactionId: string,
    public readonly idempotencyKey: string,
    public readonly payloadHash: string,
    public readonly walletId: string,
    public readonly playerId: string,
    public readonly roundId: string,
    public readonly gameId: string,
    public readonly kind: WagerTransactionKind,
    public readonly money: Money,
    public readonly referenceExternalTransactionId: string | undefined,
    public readonly createdAt: Date,
    private statusValue: WagerTransactionStatus,
    private referenceTransactionIdValue?: string,
    private failureCodeValue?: string,
    private processedAtValue?: Date,
  ) {}

  public static create(props: CreateWagerTransactionProps): WagerTransaction {
    const id = crypto.randomUUID();
    const createdAt = new Date();

    return new WagerTransaction(
      id,
      props.providerId,
      props.externalTransactionId,
      props.idempotencyKey,
      props.payloadHash,
      props.walletId,
      props.playerId,
      props.roundId,
      props.gameId,
      props.kind,
      props.money,
      props.referenceExternalTransactionId,
      createdAt,
      WagerTransactionStatus.Pending,
    );
  }

  public static restore(
    id: string,
    providerId: string,
    externalTransactionId: string,
    idempotencyKey: string,
    payloadHash: string,
    walletId: string,
    playerId: string,
    roundId: string,
    gameId: string,
    kind: WagerTransactionKind,
    money: Money,
    referenceExternalTransactionId: string | undefined,
    createdAt: Date,
    status: WagerTransactionStatus,
    referenceTransactionId?: string,
    failureCode?: string,
    processedAt?: Date,
  ): WagerTransaction {
    return new WagerTransaction(
      id,
      providerId,
      externalTransactionId,
      idempotencyKey,
      payloadHash,
      walletId,
      playerId,
      roundId,
      gameId,
      kind,
      money,
      referenceExternalTransactionId,
      createdAt,
      status,
      referenceTransactionId,
      failureCode,
      processedAt,
    );
  }

  public get status(): WagerTransactionStatus {
    return this.statusValue;
  }

  public get referenceTransactionId(): string | undefined {
    return this.referenceTransactionIdValue;
  }

  public get failureCode(): string | undefined {
    return this.failureCodeValue;
  }

  public get processedAt(): Date | undefined {
    return this.processedAtValue;
  }

  public affectsBalance(): boolean {
    if (this.kind === WagerTransactionKind.Loss) {
      return false;
    }
    return true;
  }

  public matchesPayload(hash: string): boolean {
    return this.payloadHash === hash;
  }

  public markProcessed(): void {
    if (this.requiresReference()) {
      throw new TransactionReferenceRequiredError(this.kind);
    }

    this.transitionTo(WagerTransactionStatus.Processed);
    this.processedAtValue = new Date();
  }

  public markProcessedWithReference(referenceTransactionId: string): void {
    if (!this.requiresReference()) {
      throw new UnexpectedTransactionReferenceError(this.kind);
    }

    if (!referenceTransactionId) {
      throw new MissingTransactionReferenceError(this.id);
    }

    this.transitionTo(WagerTransactionStatus.Processed);
    this.referenceTransactionIdValue = referenceTransactionId;
    this.processedAtValue = new Date();
  }

  public markPendingReference(): void {
    this.transitionTo(WagerTransactionStatus.PendingReference);
  }

  public reject(code: string): void {
    this.transitionTo(WagerTransactionStatus.Rejected);
    this.failureCodeValue = code;
    this.processedAtValue = new Date();
  }

  public fail(code: string): void {
    this.transitionTo(WagerTransactionStatus.Failed);
    this.failureCodeValue = code;
    this.processedAtValue = new Date();
  }

  private canTransitionTo(targetStatus: WagerTransactionStatus): boolean {
    const allowedTransitions = WagerTransaction.ALLOWED_TRANSITIONS[this.statusValue] || [];
    return allowedTransitions.includes(targetStatus);
  }

  private transitionTo(targetStatus: WagerTransactionStatus): void {
    if (!this.canTransitionTo(targetStatus)) {
      throw new InvalidStateTransitionError(this.id, this.statusValue, targetStatus);
    }

    this.statusValue = targetStatus;
  }

  private requiresReference(): boolean {
    return (
      this.kind === WagerTransactionKind.Refund ||
      this.kind === WagerTransactionKind.Rollback
    );
  }
}