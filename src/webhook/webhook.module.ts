import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { WebhookService } from "./webhook.service";
import { WebhookController } from "./webhook.controller";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [CommonModule, HttpModule, ConfigModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
