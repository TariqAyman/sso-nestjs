import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SsoService } from "./sso.service";
import { SsoController } from "./sso.controller";
import { OAuthService } from "./oauth.service";
import { OAuthController } from "./oauth.controller";
import { UserService } from "../user/user.service";
import { WebhookService } from "../webhook/webhook.service";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [
    CommonModule,
    HttpModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: "1h",
          algorithm: "HS256",
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SsoController, OAuthController],
  providers: [SsoService, OAuthService, UserService, WebhookService],
  exports: [SsoService, OAuthService],
})
export class SsoModule {}
