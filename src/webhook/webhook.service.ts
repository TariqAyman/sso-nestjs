import { Injectable, Logger } from "@nestjs/common";
import { SsoApplication } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { CryptoService } from "../common/services/crypto.service";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";

export interface WebhookEvent {
  event: string;
  userId: number;
  scope?: string;
  timestamp: string;
  [key: string]: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
    private cryptoService: CryptoService
  ) {}

  async sendAuthorizationEvent(
    application: SsoApplication,
    event: WebhookEvent
  ): Promise<void> {
    if (!application.webhookUrl) {
      return;
    }

    await this.sendWebhook(application, event);
  }

  async sendTokenEvent(
    application: SsoApplication,
    event: WebhookEvent
  ): Promise<void> {
    if (!application.webhookUrl) {
      return;
    }

    await this.sendWebhook(application, event);
  }

  async sendUserEvent(
    application: SsoApplication,
    event: WebhookEvent
  ): Promise<void> {
    if (!application.webhookUrl) {
      return;
    }

    await this.sendWebhook(application, event);
  }

  private async sendWebhook(
    application: SsoApplication,
    event: WebhookEvent
  ): Promise<void> {
    const payload = {
      ...event,
      application_id: application.clientId,
      delivered_at: new Date().toISOString(),
    };

    const signature = this.generateSignature(
      JSON.stringify(payload),
      application.webhookSecret || ""
    );

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(application.webhookUrl!, payload, {
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event.event,
            "User-Agent": "OpenSSO-Webhook/1.0",
          },
          timeout: 10000,
        })
      );

      await this.logWebhook(application.id, event.event, payload, {
        status: "delivered",
        httpStatusCode: response.status,
        response: JSON.stringify(response.data),
        deliveredAt: new Date(),
      });

      this.logger.log(
        `Webhook delivered successfully to ${application.applicationName} for event ${event.event}`
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      const httpStatusCode = error.response?.status;

      await this.logWebhook(application.id, event.event, payload, {
        status: "failed",
        httpStatusCode,
        errorMessage,
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
      });

      this.logger.error(
        `Webhook delivery failed to ${application.applicationName} for event ${event.event}: ${errorMessage}`
      );
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return this.cryptoService.createHmacSignature(payload, secret);
  }

  private async logWebhook(
    applicationId: number,
    event: string,
    payload: any,
    options: {
      status: string;
      httpStatusCode?: number;
      response?: string;
      errorMessage?: string;
      deliveredAt?: Date;
      nextRetryAt?: Date;
    }
  ): Promise<void> {
    await this.prisma.webhookLog.create({
      data: {
        ssoApplicationId: applicationId,
        event,
        payload: JSON.stringify(payload),
        status: options.status,
        httpStatusCode: options.httpStatusCode,
        response: options.response,
        errorMessage: options.errorMessage,
        deliveredAt: options.deliveredAt,
        nextRetryAt: options.nextRetryAt,
      },
    });
  }

  async retryFailedWebhooks(): Promise<void> {
    const failedWebhooks = await this.prisma.webhookLog.findMany({
      where: {
        status: "failed",
        nextRetryAt: {
          lte: new Date(),
        },
        attempt: {
          lt: 3, // Max 3 attempts
        },
      },
      include: {
        ssoApplication: true,
      },
    });

    for (const webhookLog of failedWebhooks) {
      try {
        const payload = JSON.parse(webhookLog.payload);
        const signature = this.generateSignature(
          webhookLog.payload,
          webhookLog.ssoApplication.webhookSecret || ""
        );

        const response: AxiosResponse = await firstValueFrom(
          this.httpService.post(
            webhookLog.ssoApplication.webhookUrl!,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": webhookLog.event,
                "User-Agent": "OpenSSO-Webhook/1.0",
              },
              timeout: 10000,
            }
          )
        );

        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: {
            status: "delivered",
            httpStatusCode: response.status,
            response: JSON.stringify(response.data),
            deliveredAt: new Date(),
            attempt: webhookLog.attempt + 1,
          },
        });

        this.logger.log(
          `Webhook retry successful for ${webhookLog.ssoApplication.applicationName} event ${webhookLog.event}`
        );
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Unknown error";
        const httpStatusCode = error.response?.status;

        await this.prisma.webhookLog.update({
          where: { id: webhookLog.id },
          data: {
            attempt: webhookLog.attempt + 1,
            errorMessage,
            httpStatusCode,
            nextRetryAt:
              webhookLog.attempt >= 2
                ? null
                : new Date(
                    Date.now() + Math.pow(2, webhookLog.attempt) * 5 * 60 * 1000
                  ), // Exponential backoff
          },
        });

        this.logger.error(
          `Webhook retry failed for ${webhookLog.ssoApplication.applicationName} event ${webhookLog.event}: ${errorMessage}`
        );
      }
    }
  }
}
