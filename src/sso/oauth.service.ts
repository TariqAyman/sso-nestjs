import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SsoService } from "./sso.service";
import { UserService } from "../user/user.service";
import { CryptoService } from "../common/services/crypto.service";
import { PrismaService } from "../common/prisma/prisma.service";
import { WebhookService } from "../webhook/webhook.service";

export interface AuthorizeRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
}

export interface TokenRequest {
  grant_type: string;
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface UserInfoResponse {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified: boolean;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private ssoService: SsoService,
    private userService: UserService,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private prisma: PrismaService,
    private webhookService: WebhookService
  ) {}

  async authorize(
    request: AuthorizeRequest,
    userId: number
  ): Promise<{ code: string; state?: string }> {
    // Validate OAuth 2.0 authorization request
    if (request.response_type !== "code") {
      throw new BadRequestException('Only "code" response type is supported');
    }

    // Find and validate the SSO application
    const application = await this.ssoService.findByClientId(request.client_id);

    if (application.status !== "active") {
      throw new UnauthorizedException("Application is not active");
    }

    // Validate redirect URI
    if (request.redirect_uri !== application.redirectUri) {
      throw new BadRequestException("Invalid redirect URI");
    }

    // Validate scope
    const requestedScopes = request.scope ? request.scope.split(" ") : ["read"];
    const allowedScopes = application.scope.split(" ");

    for (const scope of requestedScopes) {
      if (!allowedScopes.includes(scope)) {
        throw new BadRequestException(`Scope "${scope}" is not allowed`);
      }
    }

    // Generate authorization code
    const authCode = this.cryptoService.generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store authorization code
    await this.prisma.authorizationCode.create({
      data: {
        code: authCode,
        userId,
        applicationId: application.id,
        redirectUri: request.redirect_uri,
        scope: requestedScopes.join(" "),
        expiresAt,
      },
    });

    // Log authorization event
    this.logger.log(
      `Authorization code generated for user ${userId} and app ${application.applicationName}`
    );

    // Send webhook notification
    await this.webhookService.sendAuthorizationEvent(application, {
      event: "authorization_granted",
      userId,
      scope: requestedScopes.join(" "),
      timestamp: new Date().toISOString(),
    });

    return {
      code: authCode,
      state: request.state,
    };
  }

  async exchangeCodeForToken(request: TokenRequest): Promise<TokenResponse> {
    // Validate grant type
    if (request.grant_type !== "authorization_code") {
      throw new BadRequestException(
        'Only "authorization_code" grant type is supported'
      );
    }

    // Find and validate the SSO application
    const application = await this.ssoService.findByClientId(request.client_id);

    if (application.clientSecret !== request.client_secret) {
      throw new UnauthorizedException("Invalid client credentials");
    }

    if (application.status !== "active") {
      throw new UnauthorizedException("Application is not active");
    }

    // Find and validate authorization code
    const authCode = await this.prisma.authorizationCode.findUnique({
      where: { code: request.code },
      include: { user: true },
    });

    if (!authCode) {
      throw new UnauthorizedException("Invalid authorization code");
    }

    if (authCode.expiresAt < new Date()) {
      await this.prisma.authorizationCode.delete({
        where: { code: request.code },
      });
      throw new UnauthorizedException("Authorization code has expired");
    }

    if (authCode.applicationId !== application.id) {
      throw new UnauthorizedException(
        "Authorization code does not belong to this application"
      );
    }

    if (authCode.redirectUri !== request.redirect_uri) {
      throw new BadRequestException("Redirect URI mismatch");
    }

    // Generate access token
    const payload = {
      sub: authCode.userId.toString(),
      client_id: application.clientId,
      scope: authCode.scope,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: application.tokenExpirationTime,
    });

    let refreshToken: string | undefined;
    if (application.refreshTokenEnabled) {
      refreshToken = this.cryptoService.generateSecureToken(64);

      // Store refresh token
      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: authCode.userId,
          applicationId: application.id,
          scope: authCode.scope,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    // Delete the used authorization code
    await this.prisma.authorizationCode.delete({
      where: { code: request.code },
    });

    // Update last login
    await this.prisma.lastLogin.create({
      data: {
        userId: authCode.userId,
        ipAddress: "", // Will be set by controller
        userAgent: "", // Will be set by controller
      },
    });

    this.logger.log(
      `Access token issued for user ${authCode.userId} and app ${application.applicationName}`
    );

    // Send webhook notification
    await this.webhookService.sendTokenEvent(application, {
      event: "token_issued",
      userId: authCode.userId,
      scope: authCode.scope,
      timestamp: new Date().toISOString(),
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: application.tokenExpirationTime,
      refresh_token: refreshToken,
      scope: authCode.scope,
    };
  }

  async refreshToken(
    refreshTokenValue: string,
    clientId: string,
    clientSecret: string
  ): Promise<TokenResponse> {
    // Find and validate the SSO application
    const application = await this.ssoService.findByClientId(clientId);

    if (application.clientSecret !== clientSecret) {
      throw new UnauthorizedException("Invalid client credentials");
    }

    if (!application.refreshTokenEnabled) {
      throw new BadRequestException(
        "Refresh tokens are not enabled for this application"
      );
    }

    // Find and validate refresh token
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (refreshToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { token: refreshTokenValue },
      });
      throw new UnauthorizedException("Refresh token has expired");
    }

    if (refreshToken.applicationId !== application.id) {
      throw new UnauthorizedException(
        "Refresh token does not belong to this application"
      );
    }

    // Generate new access token
    const payload = {
      sub: refreshToken.userId.toString(),
      client_id: application.clientId,
      scope: refreshToken.scope,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: application.tokenExpirationTime,
    });

    // Generate new refresh token
    const newRefreshToken = this.cryptoService.generateSecureToken(64);

    // Update refresh token
    await this.prisma.refreshToken.update({
      where: { token: refreshTokenValue },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    this.logger.log(
      `Access token refreshed for user ${refreshToken.userId} and app ${application.applicationName}`
    );

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: application.tokenExpirationTime,
      refresh_token: newRefreshToken,
      scope: refreshToken.scope,
    };
  }

  async getUserInfo(accessToken: string): Promise<UserInfoResponse> {
    try {
      const decoded = this.jwtService.verify(accessToken);
      const userId = parseInt(decoded.sub, 10);

      const user = await this.userService.findById(userId);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      return {
        sub: userId.toString(),
        email: user.email,
        name: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
        given_name: user.firstName,
        family_name: user.lastName,
        picture: user.avatar,
        email_verified: user.emailVerified,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid access token");
    }
  }

  async revokeToken(token: string, tokenTypeHint?: string): Promise<void> {
    try {
      // Try to decode as access token first
      const decoded = this.jwtService.verify(token);
      this.logger.log(`Access token revoked for user ${decoded.sub}`);

      // Access tokens can't be revoked in JWT, but we log the action
      return;
    } catch {
      // If not an access token, try as refresh token
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (refreshToken) {
        await this.prisma.refreshToken.delete({
          where: { token },
        });
        this.logger.log(
          `Refresh token revoked for user ${refreshToken.userId}`
        );
      }
    }
  }
}
