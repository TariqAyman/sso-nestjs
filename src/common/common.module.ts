import { Module } from "@nestjs/common";
import { CryptoService } from "./services/crypto.service";
import { EmailService } from "./services/email.service";
import { ValidatorService } from "./services/validator.service";

@Module({
  providers: [CryptoService, EmailService, ValidatorService],
  exports: [CryptoService, EmailService, ValidatorService],
})
export class CommonModule {}
