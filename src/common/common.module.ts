import { Module } from "@nestjs/common";
import { CryptoService } from "./services/crypto.service";
import { EmailService } from "./services/email.service";
import { ValidatorService } from "./services/validator.service";
import { LoggingConfig } from "./config/logging.config";
import { RequestLoggingInterceptor } from "./interceptors/request-logging.interceptor";

@Module({
  providers: [
    CryptoService,
    EmailService,
    ValidatorService,
    LoggingConfig,
    RequestLoggingInterceptor,
  ],
  exports: [
    CryptoService,
    EmailService,
    ValidatorService,
    LoggingConfig,
    RequestLoggingInterceptor,
  ],
})
export class CommonModule {}
