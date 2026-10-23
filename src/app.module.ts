import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { HttpModule } from "./infrastructure/http/http.module";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HttpModule,
    MessagingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
