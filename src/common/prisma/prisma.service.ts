import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Successfully connected to database");
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Disconnected from database");
  }

  async enableShutdownHooks(app: any) {
    // Graceful shutdown hooks will be handled by NestJS lifecycle
  }

  async cleanDb() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot clean database in production");
    }

    return this.$transaction([
      this.webhookLog.deleteMany(),
      this.oauthConnection.deleteMany(),
      this.lastLogin.deleteMany(),
      this.forgotPassword.deleteMany(),
      this.userActivation.deleteMany(),
      this.ssoApplication.deleteMany(),
      this.faq.deleteMany(),
      this.menu.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
