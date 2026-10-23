import { Module } from "@nestjs/common";
import { SQSClient } from "@aws-sdk/client-sqs";
import { InboxConsumerWorker } from "./inbox-consumer.worker";
import { DatabaseModule } from "../database/database.module";
import { OutboxPublisherWorker } from "./outbox-publisher.worker";
import { ApplicationModule } from "src/application/application.module";
import { SQS_CLIENT, SQS_QUEUE_URL } from "./sqs.constants";

@Module({
  imports: [DatabaseModule, ApplicationModule],
  providers: [
    {
      provide: SQS_CLIENT,
      useFactory: () => {
        return new SQSClient({
          region: process.env.AWS_REGION,
          endpoint: process.env.AWS_SQS_ENDPOINT,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
          },
        });
      },
    },
    {
      provide: SQS_QUEUE_URL,
      useFactory: () => {
        return process.env.SQS_WAGER_QUEUE_URL;
      },
    },
    InboxConsumerWorker,
    OutboxPublisherWorker,
  ],
  exports: [InboxConsumerWorker, OutboxPublisherWorker],
})
export class MessagingModule {}
