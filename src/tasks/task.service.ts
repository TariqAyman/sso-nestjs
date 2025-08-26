import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WebhookService } from "../webhook/webhook.service";

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleWebhookRetries() {
    this.logger.debug("Starting webhook retry task...");

    try {
      await this.webhookService.retryFailedWebhooks();
      this.logger.debug("Webhook retry task completed successfully");
    } catch (error) {
      this.logger.error("Webhook retry task failed:", error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldWebhookLogs() {
    this.logger.debug("Starting webhook log cleanup task...");

    try {
      // This would implement cleanup of old webhook logs
      // For now, we'll just log that it ran
      this.logger.debug("Webhook log cleanup task completed");
    } catch (error) {
      this.logger.error("Webhook log cleanup task failed:", error);
    }
  }
}
