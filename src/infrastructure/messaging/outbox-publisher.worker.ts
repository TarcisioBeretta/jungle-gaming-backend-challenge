import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
} from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { SQS_CLIENT } from "./sqs.constants";
import type { OutboxRepository } from "src/application/ports/outbox.repository";
import type { UnitOfWork } from "src/application/ports/unit-of-work.interface";
import { OutboxMessage } from "src/domain/outbox/outbox-message.entity";

@Injectable()
export class OutboxPublisherWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherWorker.name);
  private isRunning = false;
  private isProcessing = false;

  constructor(
    @Inject("OutboxRepository")
    private readonly outboxRepository: OutboxRepository,
    @Inject("UnitOfWork")
    private readonly unitOfWork: UnitOfWork,
    @Inject(SQS_CLIENT)
    private readonly sqsClient: SQSClient,
  ) {}

  public onModuleInit(): void {
    this.isRunning = true;
    this.logger.log("OutboxPublisherWorker initialized and ready.");
  }

  public onModuleDestroy(): void {
    this.isRunning = false;
    this.logger.log("OutboxPublisherWorker stopped.");
  }

  @Interval(3000)
  async handleOutboxMessages(): Promise<void> {
    if (!this.isRunning || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.processPendingBatch();
    } catch (error: unknown) {
      this.logger.error("Error processing outbox messages batch:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processPendingBatch(): Promise<void> {
    const messages = await this.outboxRepository.findPending();

    if (messages.length === 0) {
      return;
    }

    for (const message of messages) {
      await this.processSingleMessage(message);
    }
  }

  private async processSingleMessage(message: OutboxMessage): Promise<void> {
    try {
      await this.publishToBroker(message);

      message.markPublished();

      await this.outboxRepository.update(message);
      await this.unitOfWork.commit();

      this.logger.log(`Outbox message ${message.id} (${message.eventType}) successfully published.`);
    } catch (error: unknown) {
      this.logger.error(`Failed to publish outbox message ${message.id}:`, error);

      await this.handlePublishFailure(message);
    }
  }

  private async handlePublishFailure(message: OutboxMessage): Promise<void> {
    try {
        message.scheduleRetry();

        await this.outboxRepository.update(message);

        await this.unitOfWork.commit();
    } catch (commitError) {
      this.logger.error(`Failed to schedule retry for message ${message.id}:`, commitError);
    }
  }

  private async publishToBroker(message: OutboxMessage): Promise<void> {
    const queueUrl =
      process.env.OUTBOX_QUEUE_URL ||
      "http://localstack:4566/000000000000/events.fifo";

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        eventId: message.id,
        aggregateId: message.aggregateId,
        eventType: message.eventType,
        occurredAt: message.occurredAt,
        payload: message.payload,
      }),
      MessageGroupId: message.aggregateId || message.id,
      MessageDeduplicationId: message.id,
    });

    await this.sqsClient.send(command);
  }
}
