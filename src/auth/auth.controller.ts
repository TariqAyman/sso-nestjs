import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from "class-validator";
import {
  AuthService,
  LoginDto,
  RegisterDto,
  AuthResponse,
} from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

class LoginRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

class RegisterRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  organizationId: string; // This will be set from context/request
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async register(
    @Body(ValidationPipe) registerDto: RegisterRequestDto
  ): Promise<{ message: string; userId: string }> {
    // TODO: Get organizationId from request context or authenticated user
    registerDto.organizationId = "00000000-0000-0000-0000-000000000001"; // Default organization UUID
    return this.authService.register(registerDto);
  }

  @Post("login")
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body(ValidationPipe) loginDto: LoginRequestDto,
    @Req() req
  ): Promise<AuthResponse> {
    const ipAddress = req.ip || req.connection.remoteAddress || "";
    const userAgent = req.get("User-Agent") || "";

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  async logout(@Request() req): Promise<{ message: string }> {
    return this.authService.logout(req.user.id);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(
    @Body(ValidationPipe) refreshDto: RefreshTokenDto
  ): Promise<{ accessToken: string; expiresIn: number }> {
    return this.authService.refreshToken(refreshDto.refreshToken);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 200, description: "Password reset email sent" })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto
  ): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successful" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
  }

  @Get("activate")
  @ApiOperation({ summary: "Activate user account" })
  @ApiResponse({ status: 200, description: "Account activated successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async activate(@Query("token") token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException("Activation token is required");
    }
    return this.authService.activateAccount(token);
  }

  @Post("resend-activation")
  @ApiOperation({ summary: "Resend activation email" })
  @ApiResponse({ status: 200, description: "Activation email sent" })
  async resendActivation(
    @Body() body: { email: string }
  ): Promise<{ message: string }> {
    return this.authService.resendActivationEmail(body.email);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  async getProfile(@Request() req): Promise<any> {
    return {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      verified: req.user.verified,
      role: req.user.role,
      status: req.user.status,
      twoFactorEnabled: req.user.twoFactorEnabled,
      profilePicture: req.user.profilePicture,
      timezone: req.user.timezone,
      language: req.user.language,
      lastLoginAt: req.user.lastLoginAt,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };
  }

  // OAuth Routes
  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth login" })
  async googleLogin(): Promise<void> {
    // This method is handled by passport
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleCallback(@Request() req, @Res() res: Response): Promise<void> {
    // Handle OAuth callback and redirect with token
    const token = "generated-token"; // Generate actual token here
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }

  @Get("github")
  @UseGuards(AuthGuard("github"))
  @ApiOperation({ summary: "GitHub OAuth login" })
  async githubLogin(): Promise<void> {
    // This method is handled by passport
  }

  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  @ApiOperation({ summary: "GitHub OAuth callback" })
  async githubCallback(@Request() req, @Res() res: Response): Promise<void> {
    const token = "generated-token"; // Generate actual token here
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }

  @Get("facebook")
  @UseGuards(AuthGuard("facebook"))
  @ApiOperation({ summary: "Facebook OAuth login" })
  async facebookLogin(): Promise<void> {
    // This method is handled by passport
  }

  @Get("facebook/callback")
  @UseGuards(AuthGuard("facebook"))
  @ApiOperation({ summary: "Facebook OAuth callback" })
  async facebookCallback(@Request() req, @Res() res: Response): Promise<void> {
    const token = "generated-token"; // Generate actual token here
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }

  @Get("twitter")
  @UseGuards(AuthGuard("twitter"))
  @ApiOperation({ summary: "Twitter OAuth login" })
  async twitterLogin(): Promise<void> {
    // This method is handled by passport
  }

  @Get("twitter/callback")
  @UseGuards(AuthGuard("twitter"))
  @ApiOperation({ summary: "Twitter OAuth callback" })
  async twitterCallback(@Request() req, @Res() res: Response): Promise<void> {
    const token = "generated-token"; // Generate actual token here
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }

  @Get("microsoft")
  @UseGuards(AuthGuard("microsoft"))
  @ApiOperation({ summary: "Microsoft OAuth login" })
  async microsoftLogin(): Promise<void> {
    // This method is handled by passport
  }

  @Get("microsoft/callback")
  @UseGuards(AuthGuard("microsoft"))
  @ApiOperation({ summary: "Microsoft OAuth callback" })
  async microsoftCallback(@Request() req, @Res() res: Response): Promise<void> {
    const token = "generated-token"; // Generate actual token here
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // Nafath SSO Routes
  @Post("nafath/initiate")
  @ApiOperation({ summary: "Initiate Nafath authentication" })
  @ApiResponse({
    status: 200,
    description: "Authentication initiated successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async nafathInitiate(
    @Body() body: { nationalId: string; channel?: "PUSH" | "QR" },
    @Req() req
  ): Promise<{
    transactionId: string;
    qrCode?: string;
    expiresIn: number;
    message: string;
  }> {
    return this.authService.initiateNafathAuth(body.nationalId, body.channel);
  }

  @Get("nafath/status/:transactionId")
  @ApiOperation({ summary: "Check Nafath transaction status" })
  @ApiResponse({ status: 200, description: "Status retrieved successfully" })
  async nafathStatus(@Param("transactionId") transactionId: string): Promise<{
    status: string;
    profile?: any;
  }> {
    return this.authService.checkNafathStatus(transactionId);
  }

  @Post("nafath/callback")
  @ApiOperation({ summary: "Nafath authentication callback" })
  @ApiResponse({ status: 200, description: "Callback processed successfully" })
  async nafathCallback(
    @Body() payload: any,
    @Request() req,
    @Res() res: Response
  ): Promise<void> {
    try {
      const signature = req.headers["x-nafath-signature"] as string;
      const result = await this.authService.handleNafathCallback(
        payload,
        signature,
        req.ip,
        req.get("User-Agent")
      );

      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}&provider=nafath`
      );
    } catch (error) {
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`
      );
    }
  }

  @Post("nafath/verify")
  @ApiOperation({
    summary: "Verify Nafath transaction and complete authentication",
  })
  @ApiResponse({
    status: 200,
    description: "Authentication completed successfully",
  })
  @ApiResponse({ status: 401, description: "Authentication failed" })
  async nafathVerify(
    @Body() body: { transactionId: string },
    @Req() req
  ): Promise<AuthResponse> {
    const ipAddress = req.ip || req.connection.remoteAddress || "";
    const userAgent = req.get("User-Agent") || "";

    return this.authService.verifyNafathTransaction(
      body.transactionId,
      ipAddress,
      userAgent
    );
  }
}
