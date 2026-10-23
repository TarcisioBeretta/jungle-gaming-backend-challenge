import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Inject } from '@nestjs/common';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import type { InboxRepository } from '../../application/ports/inbox.repository';
import type { UnitOfWork } from '../../application/ports/unit-of-work.interface';
import { InboxMessage } from '../../domain/inbox/inbox-message.entity';
import { ProcessBetUseCase } from '../../application/use-cases/process-bet.use-case';
import { ProcessWinUseCase } from '../../application/use-cases/process-win.use-case';
import { ProcessLossUseCase } from '../../application/use-cases/process-loss.use-case';
import { ProcessRefundUseCase } from '../../application/use-cases/process-refund.use-case';
import { ProcessRollbackUseCase } from '../../application/use-cases/process-rollback.use-case';
import { PayloadHash } from '../../application/utils/payload-hash.util';
import { SQS_CLIENT, SQS_QUEUE_URL } from './sqs.constants';

interface SqsWagerMessageBody {
  messageId: string;
  type: string;
  occurredAt: string;
  data: {
    providerId: string;
    externalTransactionId: string;
    idempotencyKey: string;
    playerId: string;
    walletId: string;
    roundId: string;
    gameId: string;
    kind: string;
    money: {
      amount: string;
      currency: string;
    };
    referenceExternalTransactionId?: string;
  };
}

@Injectable()
export class InboxConsumerWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InboxConsumerWorker.name);
  private isRunning = false;
  private readonly consumerName = 'wager-transaction-consumer';

  constructor(
    @Inject('InboxRepository')
    private readonly inboxRepository: InboxRepository,
    @Inject('UnitOfWork')
    private readonly unitOfWork: UnitOfWork,
    private readonly processBetUseCase: ProcessBetUseCase,
    private readonly processWinUseCase: ProcessWinUseCase,
    private readonly processLossUseCase: ProcessLossUseCase,
    private readonly processRefundUseCase: ProcessRefundUseCase,
    private readonly processRollbackUseCase: ProcessRollbackUseCase,
    @Inject(SQS_CLIENT)
    private readonly sqsClient: SQSClient,
    @Inject(SQS_QUEUE_URL)
    private readonly queueUrl: string,
  ) {}

  public onModuleInit(): void {
    this.isRunning = true;
    this.pollMessages().catch((err: unknown) => {
      this.logger.error('Fatal error in SQS polling loop', err);
    });
  }

  public onModuleDestroy(): void {
    this.isRunning = false;
  }

  private async pollMessages(): Promise<void> {
    this.logger.log('Starting SQS consumer polling loop...');

    while (this.isRunning) {
      try {
        const response = await this.receiveMessages();

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            await this.safeProcessMessage(message);
          }
        }
      } catch (error: unknown) {
        this.logger.error('Error receiving messages from SQS', error);
        await this.delay(5000);
      }
    }
  }

  private async receiveMessages() {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All'],
    });
    return this.sqsClient.send(command);
  }

  private async safeProcessMessage(message: Message): Promise<void> {
    const messageId = message.MessageId;
    try {
      await this.processSingleMessage(message.Body, message.ReceiptHandle);
    } catch (error: unknown) {
      this.logger.error(`Failed to process SQS message ${messageId}:`, error);
    }
  }

  private async processSingleMessage(rawBody?: string, receiptHandle?: string): Promise<void> {
    if (!rawBody || !receiptHandle) return;

    const parsedBody = this.parseMessageBody(rawBody);
    if (!parsedBody) return;

    const { messageId, data } = parsedBody;
    const kind = data.kind.toUpperCase();

    if (await this.isAlreadyProcessed(messageId, receiptHandle)) {
      return;
    }

    await this.registerAndExecuteDomain(messageId, kind, data);

    await this.deleteMessage(receiptHandle);
    this.logger.log(`Successfully processed and acknowledged SQS message ${messageId}`);
  }

  private parseMessageBody(rawBody: string): SqsWagerMessageBody | null {
    try {
      return JSON.parse(rawBody) as SqsWagerMessageBody;
    } catch (e: unknown) {
      this.logger.error('Invalid JSON structure in SQS message', rawBody);
      return null;
    }
  }

  private async isAlreadyProcessed(messageId: string, receiptHandle: string): Promise<boolean> {
    const existingInbox = await this.inboxRepository.findByConsumerAndMessageId(
      this.consumerName,
      messageId,
    );

    if (existingInbox && existingInbox.isProcessed()) {
      this.logger.warn(`Message ${messageId} already processed by consumer ${this.consumerName}. Acknowledging.`);
      await this.deleteMessage(receiptHandle);
      return true;
    }

    return false;
  }

  private async registerAndExecuteDomain(
    messageId: string,
    kind: string,
    data: SqsWagerMessageBody['data'],
  ): Promise<void> {
    const idempotencyKey = data.idempotencyKey || `${data.providerId}:${data.externalTransactionId}`;
    const payloadHash = PayloadHash.from({
      providerId: data.providerId,
      externalTransactionId: data.externalTransactionId,
      walletId: data.walletId,
      playerId: data.playerId,
      roundId: data.roundId,
      gameId: data.gameId,
      kind,
      money: data.money,
      referenceExternalTransactionId: data.referenceExternalTransactionId,
    });

    const commonCommand = {
      providerId: data.providerId,
      externalTransactionId: data.externalTransactionId,
      idempotencyKey,
      payloadHash,
      walletId: data.walletId,
      playerId: data.playerId,
      roundId: data.roundId,
      gameId: data.gameId,
      amount: data.money.amount,
      currency: data.money.currency,
    };

    await this.ensureInboxRegistered(messageId, payloadHash, data);

    try {
      await this.executeUseCase(kind, data, commonCommand);

      const inboxMessage = await this.inboxRepository.findByConsumerAndMessageId(
        this.consumerName,
        messageId,
      );
      if (inboxMessage) {
        inboxMessage.markProcessed();
        await this.inboxRepository.update(inboxMessage);
      }

      await this.unitOfWork.commit();
    } catch (error: unknown) {
      this.logger.error(`Domain/Infrastructure error processing SQS message ${messageId}:`, error);
      throw error;
    }
  }

  private async ensureInboxRegistered(
    messageId: string,
    payloadHash: string,
    data: SqsWagerMessageBody['data'],
  ): Promise<InboxMessage> {
    let inboxMessage = await this.inboxRepository.findByConsumerAndMessageId(
      this.consumerName,
      messageId,
    );

    if (!inboxMessage) {
      inboxMessage = InboxMessage.create({
        messageId,
        consumerName: this.consumerName,
        payloadHash,
        payload: data as unknown as Record<string, unknown>,
      });
      await this.inboxRepository.add(inboxMessage);
    }

    return inboxMessage;
  }

  private async executeUseCase(kind: string, data: SqsWagerMessageBody['data'], common: any): Promise<void> {
    switch (kind) {
      case 'BET':
        await this.processBetUseCase.execute(common);
        break;
      case 'WIN':
        await this.processWinUseCase.execute(common);
        break;
      case 'LOSS':
        await this.processLossUseCase.execute(common);
        break;
      case 'REFUND':
        await this.processRefundUseCase.execute({
          ...common,
          referenceExternalTransactionId: data.referenceExternalTransactionId ?? '',
        });
        break;
      case 'ROLLBACK':
        await this.processRollbackUseCase.execute({
          ...common,
          referenceExternalTransactionId: data.referenceExternalTransactionId ?? '',
        });
        break;
      default:
        throw new Error(`Unsupported transaction kind in SQS consumer: ${kind}`);
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<string | undefined> {
    const deleteCommand = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });
    const result = await this.sqsClient.send(deleteCommand);
    return result.$metadata.requestId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}