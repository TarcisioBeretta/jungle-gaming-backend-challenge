import { Module } from "@nestjs/common";
import { SQSClient } from "@aws-sdk/client-sqs";
import { InboxConsumerWorker } from "./inbox-consumer.worker";
import { DatabaseModule } from "../database/database.module";
import { OutboxPublisherWorker } from "./outbox-publisher.worker";

export const SQS_CLIENT = "SQS_CLIENT";
export const SQS_QUEUE_URL = "SQS_QUEUE_URL";

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: SQS_CLIENT,
      useFactory: () => {
        return new SQSClient({
          region: process.env.AWS_REGION || "us-east-1",
          endpoint: process.env.AWS_SQS_ENDPOINT || "http://localstack:4566",
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
          },
        });
      },
    },
    {
      provide: SQS_QUEUE_URL,
      useFactory: () => {
        return (
          process.env.SQS_WAGER_QUEUE_URL ||
          "http://localstack:4566/000000000000/wager-transactions.fifo"
        );
      },
    },
    InboxConsumerWorker,
    OutboxPublisherWorker,
  ],
  exports: [InboxConsumerWorker, OutboxPublisherWorker],
})
export class MessagingModule {}
