import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { HealthController } from "./controllers/health.controller";
import { ProviderController } from "./controllers/provider.controller";
import { WageringController } from "./controllers/wagering.controller";
import { WalletController } from "./controllers/wallet.controller";
import { ApplicationModule } from "src/application/application.module";

@Module({
  imports: [DatabaseModule, ApplicationModule],
  controllers: [
    WalletController,
    WageringController,
    ProviderController,
    HealthController,
  ],
  providers: [],
})
export class HttpModule {}
