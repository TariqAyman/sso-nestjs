import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "@prisma/client";
import { UsersService } from "../users/users.service";
import { CryptoService } from "../common/services/crypto.service";
import { EmailService } from "../common/services/email.service";
import { PrismaService } from "../common/prisma/prisma.service";
import { NafathService, NafathProfile } from "./services/nafath.service";

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  organizationId: bigint;
  timezone?: string;
  language?: string;
}

export interface AuthResponse {
  user: {
    id: bigint;
    email: string;
    fullName: string | null;
    emailVerified: boolean;
    role: number;
    twoFactorEnabled: boolean;
  };
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Helper function to convert JsonValue to string
function jsonValueToString(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export interface JwtPayload {
  sub: string; // Convert bigint to string for JWT
  email: string;
  role: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
    private emailService: EmailService,
    private prisma: PrismaService,
    private nafathService: NafathService
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      return null;
    }

    // Check if account is locked
    if (await this.usersService.isAccountLocked(user.id)) {
      throw new UnauthorizedException(
        "Account is temporarily locked due to multiple failed login attempts"
      );
    }

    // Verify password
    const isPasswordValid = await this.cryptoService.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      await this.usersService.recordFailedLogin(
        user.id,
        "",
        "",
        "Invalid password"
      );
      return null;
    }

    return user;
  }

  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const { email, password, rememberMe = false } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== 1) {
      // 1 = active status
      throw new UnauthorizedException("Account is not active");
    }

    // Record successful login
    await this.usersService.recordLogin(user.id, ipAddress, userAgent);

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id.toString(), // Convert bigint to string for JWT
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = this.getTokenExpirationTime();

    let refreshToken: string | undefined;
    if (rememberMe) {
      refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN", "7d"),
      });
    }

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: jsonValueToString(user.fullName),
        emailVerified: !!user.emailVerifiedAt,
        role: user.role,
        twoFactorEnabled: !!user.twoFactorEnabled,
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async register(
    registerDto: RegisterDto
  ): Promise<{ message: string; userId: bigint }> {
    const user = await this.usersService.create(registerDto);

    // Generate activation token
    const token = this.cryptoService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiredAt: expiresAt,
      },
    });

    // Send activation email
    await this.emailService.sendActivationEmail(
      user.email,
      token,
      jsonValueToString(user.fullName)
    );

    this.logger.log(`User registered: ${user.email}`);

    return {
      message:
        "Registration successful. Please check your email to activate your account.",
      userId: user.id,
    };
  }

  async activateAccount(token: string): Promise<{ message: string }> {
    const activation = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!activation) {
      throw new BadRequestException("Invalid activation token");
    }

    if (activation.usedAt) {
      throw new BadRequestException("Activation token has already been used");
    }

    if (activation.expiredAt && activation.expiredAt < new Date()) {
      throw new BadRequestException("Activation token has expired");
    }

    // Activate user and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: activation.userId },
        data: {
          emailVerifiedAt: new Date(),
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      activation.user.email,
      jsonValueToString(activation.user.fullName)
    );

    this.logger.log(`Account activated: ${activation.user.email}`);

    return { message: "Account activated successfully" };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists or not
      return {
        message: "If the email exists, a password reset link has been sent.",
      };
    }

    // Generate reset token
    const token = this.cryptoService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiredAt: expiresAt,
      },
    });

    // Send reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      token,
      jsonValueToString(user.fullName)
    );

    this.logger.log(`Password reset requested for: ${user.email}`);

    return {
      message: "If the email exists, a password reset link has been sent.",
    };
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const resetRequest = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest) {
      throw new BadRequestException("Invalid reset token");
    }

    if (resetRequest.usedAt) {
      throw new BadRequestException("Reset token has already been used");
    }

    if (resetRequest.expiredAt && resetRequest.expiredAt < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    // Update password and mark token as used
    await this.prisma.$transaction(async (tx) => {
      await this.usersService.updatePassword(resetRequest.userId, newPassword);
      await tx.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      });
    });

    this.logger.log(`Password reset completed for: ${resetRequest.user.email}`);

    return { message: "Password reset successfully" };
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findById(BigInt(payload.sub));

      if (!user || user.status !== 1) {
        // 1 = active status
        throw new UnauthorizedException("Invalid refresh token");
      }

      const newPayload: JwtPayload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload);
      const expiresIn = this.getTokenExpirationTime();

      return { accessToken, expiresIn };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: bigint): Promise<{ message: string }> {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just log the logout event
    this.logger.log(`User ${userId} logged out`);
    return { message: "Logged out successfully" };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any | null> {
    const user = await this.usersService.findById(BigInt(payload.sub));

    if (!user || user.status !== 1) {
      // 1 = active status
      return null;
    }

    // Return a simplified user object for JWT validation
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  private getTokenExpirationTime(): number {
    const expiresIn = this.configService.get("JWT_EXPIRES_IN", "24h");
    // Convert string like "24h" to seconds
    if (expiresIn.endsWith("h")) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith("d")) {
      return parseInt(expiresIn) * 24 * 3600;
    } else if (expiresIn.endsWith("m")) {
      return parseInt(expiresIn) * 60;
    }
    return 24 * 3600; // Default to 24 hours
  }

  async resendActivationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message: "If the email exists, an activation link has been sent.",
      };
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException("Account is already verified");
    }

    // Deactivate existing tokens
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Generate new activation token
    const token = this.cryptoService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiredAt: expiresAt,
      },
    });

    // Send activation email
    await this.emailService.sendActivationEmail(
      user.email,
      token,
      jsonValueToString(user.fullName)
    );

    this.logger.log(`Activation email resent to: ${user.email}`);

    return {
      message: "If the email exists, an activation link has been sent.",
    };
  }

  // Nafath SSO Methods

  async initiateNafathAuth(
    nationalId: string,
    channel: "PUSH" | "QR" = "PUSH"
  ): Promise<{
    transactionId: string;
    qrCode?: string;
    expiresIn: number;
    message: string;
  }> {
    try {
      const result = await this.nafathService.initiateAuth(nationalId, channel);

      this.logger.log(
        `Nafath authentication initiated for NID: ${nationalId.substring(0, 4)}****`
      );

      return {
        ...result,
        message:
          channel === "PUSH"
            ? "Please approve the authentication request in your Nafath app"
            : "Please scan the QR code with your Nafath app",
      };
    } catch (error) {
      this.logger.error(`Failed to initiate Nafath auth: ${error.message}`);
      throw error;
    }
  }

  async checkNafathStatus(transactionId: string): Promise<{
    status: string;
    profile?: any;
  }> {
    try {
      const result =
        await this.nafathService.checkTransactionStatus(transactionId);
      return {
        status: result.status,
        profile: result.profile,
      };
    } catch (error) {
      this.logger.error(`Failed to check Nafath status: ${error.message}`);
      throw error;
    }
  }

  async handleNafathCallback(
    payload: any,
    signature: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResponse> {
    try {
      const profile = await this.nafathService.handleCallback(
        payload,
        signature
      );

      // Find or create user with Nafath profile
      let user = await this.findOrCreateNafathUser(profile);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Record successful login
      await this.usersService.recordLogin(user.id, ipAddress, userAgent);

      this.logger.log(
        `Nafath authentication successful for NID: ${profile.nationalId.substring(0, 4)}****`
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: jsonValueToString(user.fullName),
          emailVerified: !!user.emailVerifiedAt,
          role: user.role,
          twoFactorEnabled: !!user.twoFactorEnabled,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      this.logger.error(`Nafath callback error: ${error.message}`);
      throw error;
    }
  }

  async verifyNafathTransaction(
    transactionId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResponse> {
    try {
      const statusResult =
        await this.nafathService.checkTransactionStatus(transactionId);

      if (statusResult.status !== "APPROVED" || !statusResult.profile) {
        throw new UnauthorizedException(
          `Authentication ${statusResult.status.toLowerCase()}`
        );
      }

      // Find or create user with Nafath profile
      let user = await this.findOrCreateNafathUser(statusResult.profile);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Record successful login
      await this.usersService.recordLogin(user.id, ipAddress, userAgent);

      this.logger.log(
        `Nafath verification successful for NID: ${statusResult.profile.nationalId.substring(0, 4)}****`
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: jsonValueToString(user.fullName),
          emailVerified: !!user.emailVerifiedAt,
          role: user.role,
          twoFactorEnabled: !!user.twoFactorEnabled,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      this.logger.error(`Nafath verification error: ${error.message}`);
      throw error;
    }
  }

  private async findOrCreateNafathUser(profile: NafathProfile): Promise<User> {
    // Try to find existing user by national ID or email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: profile.email || `${profile.nationalId}@nafath.sa` },
          // We could store national ID in a custom field if needed
        ],
      },
    });

    if (user) {
      // Update user profile with latest Nafath data
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: profile.fullNameEn || profile.fullNameAr || user.fullName,
          emailVerifiedAt: new Date(), // Nafath users are verified by default
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new user from Nafath profile
      const email = profile.email || `${profile.nationalId}@nafath.sa`;
      const fullName =
        profile.fullNameEn ||
        profile.fullNameAr ||
        `Nafath User ${profile.nationalId.substring(0, 4)}****`;

      user = await this.prisma.user.create({
        data: {
          organizationId: BigInt(1), // Default organization
          email,
          password: "", // Nafath users don't need passwords
          fullName,
          emailVerifiedAt: profile.email ? new Date() : null, // Only verified if we have real email
          role: 0, // 0 = user role
          status: 1, // 1 = active status
          language: profile.fullNameAr ? "ar" : "en",
          lastLoginAt: new Date(),
        },
      });

      // Create OAuth connection record
      await this.prisma.oauthConnection.create({
        data: {
          userId: user.id,
          provider: "nafath",
          providerId: profile.nationalId,
          email: profile.email,
          name: fullName,
          profileData: JSON.stringify({
            nationalId: profile.nationalId,
            fullNameAr: profile.fullNameAr,
            fullNameEn: profile.fullNameEn,
            dateOfBirth: profile.dateOfBirth,
            nationality: profile.nationality,
            mobile: profile.mobile,
          }),
          connectedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });

      this.logger.log(`Created new Nafath user: ${email}`);
    }

    return user;
  }

  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(
        { ...payload, type: "refresh" },
        {
          expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN", "7d"),
        }
      ),
    ]);

    // For Nafath, we'll skip storing refresh tokens in DB for now
    // since they don't have an SSO application context
    // TODO: Create a default "Nafath SSO" application for this

    return { accessToken, refreshToken };
  }
}
