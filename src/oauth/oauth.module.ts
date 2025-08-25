import { Module } from "@nestjs/common";
import { OauthController } from "./oauth.controller";
import { OauthService } from "./oauth.service";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [CommonModule],
  controllers: [OauthController],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
