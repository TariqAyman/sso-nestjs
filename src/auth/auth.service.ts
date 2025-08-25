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

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  timezone?: string;
  language?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    fullName: string;
    verified: boolean;
    role: string;
    twoFactorEnabled: boolean;
  };
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
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
    private prisma: PrismaService
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

    if (user.status !== "active") {
      throw new UnauthorizedException("Account is not active");
    }

    // Record successful login
    await this.usersService.recordLogin(user.id, ipAddress, userAgent);

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
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
        fullName: user.fullName,
        verified: user.verified,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async register(
    registerDto: RegisterDto
  ): Promise<{ message: string; userId: number }> {
    const user = await this.usersService.create(registerDto);

    // Generate activation token
    const token = this.cryptoService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.userActivation.create({
      data: {
        userId: user.id,
        token,
        type: "email",
        expiresAt,
      },
    });

    // Send activation email
    await this.emailService.sendActivationEmail(
      user.email,
      token,
      user.fullName
    );

    this.logger.log(`User registered: ${user.email}`);

    return {
      message:
        "Registration successful. Please check your email to activate your account.",
      userId: user.id,
    };
  }

  async activateAccount(token: string): Promise<{ message: string }> {
    const activation = await this.prisma.userActivation.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!activation) {
      throw new BadRequestException("Invalid activation token");
    }

    if (activation.usedAt) {
      throw new BadRequestException("Activation token has already been used");
    }

    if (activation.expiresAt < new Date()) {
      throw new BadRequestException("Activation token has expired");
    }

    // Activate user and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: activation.userId },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      }),
      this.prisma.userActivation.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      activation.user.email,
      activation.user.fullName
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

    await this.prisma.forgotPassword.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.fullName
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
    const resetRequest = await this.prisma.forgotPassword.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest) {
      throw new BadRequestException("Invalid reset token");
    }

    if (resetRequest.usedAt) {
      throw new BadRequestException("Reset token has already been used");
    }

    if (resetRequest.expiresAt < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    // Update password and mark token as used
    await this.prisma.$transaction(async (tx) => {
      await this.usersService.updatePassword(resetRequest.userId, newPassword);
      await tx.forgotPassword.update({
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
      const user = await this.usersService.findById(payload.sub);

      if (!user || user.status !== "active") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const newPayload: JwtPayload = {
        sub: user.id,
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

  async logout(userId: number): Promise<{ message: string }> {
    // In a more complex setup, you might want to blacklist the token
    // For now, we'll just log the logout event
    this.logger.log(`User ${userId} logged out`);
    return { message: "Logged out successfully" };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.status !== "active") {
      return null;
    }

    return {
      ...user,
      password: "", // Don't expose password in JWT payload
    } as User;
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

    if (user.verified) {
      throw new BadRequestException("Account is already verified");
    }

    // Deactivate existing tokens
    await this.prisma.userActivation.updateMany({
      where: {
        userId: user.id,
        type: "email",
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Generate new activation token
    const token = this.cryptoService.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.userActivation.create({
      data: {
        userId: user.id,
        token,
        type: "email",
        expiresAt,
      },
    });

    // Send activation email
    await this.emailService.sendActivationEmail(
      user.email,
      token,
      user.fullName
    );

    this.logger.log(`Activation email resent to: ${user.email}`);

    return {
      message: "If the email exists, an activation link has been sent.",
    };
  }
}
