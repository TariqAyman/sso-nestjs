import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GitHubStrategy } from "./strategies/github.strategy";
import { FacebookStrategy } from "./strategies/facebook.strategy";
import { TwitterStrategy } from "./strategies/twitter.strategy";
import { MicrosoftStrategy } from "./strategies/microsoft.strategy";
import { UsersModule } from "../users/users.module";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRES_IN", "24h"),
          algorithm: "HS256",
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    FacebookStrategy,
    TwitterStrategy,
    MicrosoftStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
