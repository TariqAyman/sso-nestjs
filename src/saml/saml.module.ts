import { Module } from "@nestjs/common";
import { SamlController } from "./saml.controller";
import { SamlService } from "./saml.service";
import { TenantModule } from "../tenant/tenant.module";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TenantModule, UserModule, AuthModule],
  controllers: [SamlController],
  providers: [SamlService],
  exports: [SamlService],
})
export class SamlModule {}
