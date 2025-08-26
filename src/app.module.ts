import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule } from "@nestjs/cache-manager";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { SsoModule } from "./sso/sso.module";
import { OauthModule } from "./oauth/oauth.module";
import { UserModule } from "./user/user.module";
import { WebhookModule } from "./webhook/webhook.module";
import { TaskModule } from "./tasks/task.module";
import { CommonModule } from "./common/common.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 60, // 60 requests per minute
      },
    ]),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
    }),

    // Database
    PrismaModule,

    // Feature modules
    CommonModule,
    AuthModule,
    UsersModule,
    UserModule,
    SsoModule,
    OauthModule,
    WebhookModule,
    TaskModule,
  ],
})
export class AppModule {}
