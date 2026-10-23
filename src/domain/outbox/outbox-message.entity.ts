export interface OutboxMessageProps {
  aggregateId?: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt?: Date;
  attempts?: number;
  nextAttemptAt?: Date;
  publishedAt?: Date;
}

export class OutboxMessage {
  private constructor(
    public readonly id: string,
    public readonly aggregateId: string | undefined,
    public readonly eventType: string,
    public readonly payload: Record<string, unknown>,
    public readonly occurredAt: Date,
    private attemptsValue: number,
    private nextAttemptAtValue?: Date,
    private publishedAtValue?: Date,
  ) {}

  public static create(props: OutboxMessageProps): OutboxMessage {
    return new OutboxMessage(
      crypto.randomUUID(),
      props.aggregateId,
      props.eventType,
      props.payload,
      props.occurredAt ?? new Date(),
      props.attempts ?? 0,
      props.nextAttemptAt,
      props.publishedAt,
    );
  }

  public static restore(
    id: string,
    aggregateId: string | undefined,
    eventType: string,
    payload: Record<string, unknown>,
    occurredAt: Date,
    attempts: number,
    nextAttemptAt?: Date,
    publishedAt?: Date,
  ): OutboxMessage {
    return new OutboxMessage(
      id,
      aggregateId,
      eventType,
      payload,
      occurredAt,
      attempts,
      nextAttemptAt,
      publishedAt,
    );
  }

  public get attempts(): number {
    return this.attemptsValue;
  }

  public get nextAttemptAt(): Date | undefined {
    return this.nextAttemptAtValue;
  }

  public get publishedAt(): Date | undefined {
    return this.publishedAtValue;
  }

  public isPending(): boolean {
    return this.publishedAtValue === undefined;
  }

  public isDue(now: Date): boolean {
    if (!this.isPending()) {
      return false;
    }

    return this.nextAttemptAtValue === undefined || now >= this.nextAttemptAtValue;
  }

  public markPublished(publishedAt: Date = new Date()): void {
    this.publishedAtValue = publishedAt;
    this.nextAttemptAtValue = undefined;
  }

  public scheduleRetry(now: Date = new Date(), retryDelayMs = 30_000): void {
    this.attemptsValue += 1;
    this.nextAttemptAtValue = new Date(now.getTime() + retryDelayMs);
  }
}
