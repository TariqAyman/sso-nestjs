import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
  Response,
  BadRequestException,
  UnauthorizedException,
  Render,
  Headers,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response as ExpressResponse } from "express";
import { OAuthService, AuthorizeRequest, TokenRequest } from "./oauth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("OAuth 2.0")
@Controller("oauth")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get("authorize")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "OAuth 2.0 Authorization Endpoint" })
  @ApiResponse({
    status: 302,
    description: "Redirects to client with authorization code",
  })
  @ApiResponse({ status: 400, description: "Invalid request parameters" })
  async authorize(
    @Query() query: AuthorizeRequest,
    @Request() req,
    @Response() res: ExpressResponse
  ) {
    try {
      // Validate required parameters
      if (!query.response_type || !query.client_id || !query.redirect_uri) {
        throw new BadRequestException("Missing required parameters");
      }

      const result = await this.oauthService.authorize(query, req.user.id);

      // Build redirect URL with authorization code
      const redirectUrl = new URL(query.redirect_uri);
      redirectUrl.searchParams.set("code", result.code);

      if (result.state) {
        redirectUrl.searchParams.set("state", result.state);
      }

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      // Redirect with error
      const redirectUrl = new URL(query.redirect_uri);
      redirectUrl.searchParams.set("error", "server_error");
      redirectUrl.searchParams.set("error_description", error.message);

      if (query.state) {
        redirectUrl.searchParams.set("state", query.state);
      }

      return res.redirect(redirectUrl.toString());
    }
  }

  @Get("consent")
  @UseGuards(JwtAuthGuard)
  @Render("consent")
  @ApiOperation({ summary: "OAuth 2.0 Consent Page" })
  async showConsentPage(@Query() query: AuthorizeRequest, @Request() req) {
    try {
      // Find the application
      const application = await this.oauthService["ssoService"].findByClientId(
        query.client_id
      );

      const requestedScopes = query.scope ? query.scope.split(" ") : ["read"];

      return {
        application,
        scopes: requestedScopes,
        authorizeUrl: `/oauth/authorize?${new URLSearchParams(query as any).toString()}`,
        user: req.user,
      };
    } catch (error) {
      throw new BadRequestException("Invalid client application");
    }
  }

  @Post("token")
  @ApiOperation({ summary: "OAuth 2.0 Token Endpoint" })
  @ApiResponse({ status: 200, description: "Access token issued successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Invalid client credentials" })
  async token(
    @Body() tokenRequest: TokenRequest,
    @Headers("x-forwarded-for") forwardedFor?: string,
    @Headers("x-real-ip") realIp?: string,
    @Request() req?: any
  ) {
    // Validate required parameters
    if (
      !tokenRequest.grant_type ||
      !tokenRequest.code ||
      !tokenRequest.client_id ||
      !tokenRequest.client_secret ||
      !tokenRequest.redirect_uri
    ) {
      throw new BadRequestException("Missing required parameters");
    }

    return this.oauthService.exchangeCodeForToken(tokenRequest);
  }

  @Post("token/refresh")
  @ApiOperation({ summary: "OAuth 2.0 Refresh Token" })
  @ApiResponse({
    status: 200,
    description: "Access token refreshed successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refreshToken(
    @Body()
    body: {
      grant_type: string;
      refresh_token: string;
      client_id: string;
      client_secret: string;
    }
  ) {
    if (body.grant_type !== "refresh_token") {
      throw new BadRequestException("Invalid grant type");
    }

    if (!body.refresh_token || !body.client_id || !body.client_secret) {
      throw new BadRequestException("Missing required parameters");
    }

    return this.oauthService.refreshToken(
      body.refresh_token,
      body.client_id,
      body.client_secret
    );
  }

  @Get("userinfo")
  @ApiBearerAuth()
  @ApiOperation({ summary: "OAuth 2.0 UserInfo Endpoint" })
  @ApiResponse({
    status: 200,
    description: "User information retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Invalid access token" })
  async getUserInfo(@Headers("authorization") authorization?: string) {
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header"
      );
    }

    const accessToken = authorization.substring(7); // Remove "Bearer " prefix
    return this.oauthService.getUserInfo(accessToken);
  }

  @Post("revoke")
  @ApiOperation({ summary: "OAuth 2.0 Token Revocation" })
  @ApiResponse({ status: 200, description: "Token revoked successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  async revokeToken(
    @Body()
    body: {
      token: string;
      token_type_hint?: string;
      client_id: string;
      client_secret: string;
    }
  ) {
    if (!body.token || !body.client_id || !body.client_secret) {
      throw new BadRequestException("Missing required parameters");
    }

    // Verify client credentials first
    try {
      await this.oauthService["ssoService"].findByClientId(body.client_id);
    } catch {
      throw new UnauthorizedException("Invalid client credentials");
    }

    await this.oauthService.revokeToken(body.token, body.token_type_hint);

    return { message: "Token revoked successfully" };
  }

  @Get(".well-known/openid_configuration")
  @ApiOperation({ summary: "OpenID Connect Discovery" })
  async openidConfiguration(@Request() req) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
      revocation_endpoint: `${baseUrl}/oauth/revoke`,
      jwks_uri: `${baseUrl}/oauth/.well-known/jwks.json`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "profile", "email", "read", "write"],
      token_endpoint_auth_methods_supported: ["client_secret_post"],
      claims_supported: [
        "sub",
        "email",
        "name",
        "given_name",
        "family_name",
        "picture",
        "email_verified",
      ],
    };
  }

  @Get(".well-known/jwks.json")
  @ApiOperation({ summary: "JSON Web Key Set" })
  async jwks() {
    // This would typically return the public keys used to verify JWTs
    // For now, return an empty key set
    return {
      keys: [],
    };
  }
}
