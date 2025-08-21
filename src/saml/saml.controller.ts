import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  HttpException,
  HttpStatus,
  Redirect,
} from "@nestjs/common";
import { Response } from "express";
import { SamlService } from "./saml.service";
import { TenantService } from "../tenant/tenant.service";
import { AuthService } from "../auth/auth.service";

@Controller("saml")
export class SamlController {
  constructor(
    private readonly samlService: SamlService,
    private readonly tenantService: TenantService,
    private readonly authService: AuthService
  ) {}

  @Get(":uuid/login")
  async login(@Param("uuid") uuid: string, @Res() res: Response) {
    try {
      const tenant = await this.tenantService.findByUuid(uuid);
      const loginUrl = await this.samlService.getLoginUrl(tenant);
      return res.redirect(loginUrl);
    } catch (error) {
      throw new HttpException("Tenant not found", HttpStatus.NOT_FOUND);
    }
  }

  @Post(":uuid/acs")
  async assertionConsumerService(
    @Param("uuid") uuid: string,
    @Body() body: any,
    @Res() res: Response
  ) {
    try {
      const tenant = await this.tenantService.findByUuid(uuid);

      // For now, we'll create a mock SAML user from the POST data
      // In a real implementation, this would parse the SAML response
      const samlUser = {
        nameID: body.nameID || "test-user-id",
        sessionIndex: body.sessionIndex || "session-123",
        attributes: {
          email: body.email || "test@example.com",
          firstName: body.firstName || "Test",
          lastName: body.lastName || "User",
        },
      };

      const user = await this.samlService.createOrUpdateUser(samlUser);
      const token = await this.authService.generateToken(user);

      // Set JWT token in cookie and redirect to frontend
      res.cookie("access_token", token, { httpOnly: true, secure: false });
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3001"}/dashboard`
      );
    } catch (error) {
      console.error("SAML ACS Error:", error);
      throw new HttpException("Authentication failed", HttpStatus.UNAUTHORIZED);
    }
  }

  @Get(":uuid/logout")
  async logout(@Param("uuid") uuid: string, @Res() res: Response) {
    try {
      const tenant = await this.tenantService.findByUuid(uuid);
      const logoutUrl = await this.samlService.getLogoutUrl(tenant);

      // Clear the JWT token
      res.clearCookie("access_token");
      return res.redirect(logoutUrl);
    } catch (error) {
      throw new HttpException("Tenant not found", HttpStatus.NOT_FOUND);
    }
  }

  @Post(":uuid/sls")
  async singleLogoutService(
    @Param("uuid") uuid: string,
    @Body() body: any,
    @Res() res: Response
  ) {
    try {
      // Handle single logout service
      res.clearCookie("access_token");
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:3001"}/login`
      );
    } catch (error) {
      console.error("SAML SLS Error:", error);
      throw new HttpException(
        "Logout failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":uuid/metadata")
  async metadata(@Param("uuid") uuid: string, @Res() res: Response) {
    try {
      const tenant = await this.tenantService.findByUuid(uuid);
      const metadata = this.samlService.generateMetadata(tenant);

      res.set("Content-Type", "application/xml");
      return res.send(metadata);
    } catch (error) {
      throw new HttpException("Tenant not found", HttpStatus.NOT_FOUND);
    }
  }
}
