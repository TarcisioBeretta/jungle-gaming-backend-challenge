export interface InboxMessageProps {
  messageId: string;
  consumerName: string;
  payloadHash: string;
  payload?: Record<string, unknown>;
  receivedAt?: Date;
  processedAt?: Date;
}

export class InboxMessage {
  private constructor(
    public readonly id: string,
    public readonly messageId: string,
    public readonly consumerName: string,
    public readonly payloadHash: string,
    public readonly payload: Record<string, unknown> | undefined,
    public readonly receivedAt: Date,
    private processedAtValue?: Date,
  ) {}

  public static create(props: InboxMessageProps): InboxMessage {
    return new InboxMessage(
      crypto.randomUUID(),
      props.messageId,
      props.consumerName,
      props.payloadHash,
      props.payload,
      props.receivedAt ?? new Date(),
      props.processedAt,
    );
  }

  public static restore(
    id: string,
    messageId: string,
    consumerName: string,
    payloadHash: string,
    payload: Record<string, unknown> | undefined,
    receivedAt: Date,
    processedAt?: Date,
  ): InboxMessage {
    return new InboxMessage(
      id,
      messageId,
      consumerName,
      payloadHash,
      payload,
      receivedAt,
      processedAt,
    );
  }

  public get processedAt(): Date | undefined {
    return this.processedAtValue;
  }

  public isProcessed(): boolean {
    return this.processedAtValue !== undefined;
  }

  public markProcessed(processedAt: Date = new Date()): void {
    this.processedAtValue = processedAt;
  }
}
