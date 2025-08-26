import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { User, Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import { CryptoService } from "../common/services/crypto.service";
import { ValidatorService } from "../common/services/validator.service";

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  timezone?: string;
  language?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  timezone?: string;
  language?: string;
  profilePicture?: string;
  twoFactorEnabled?: boolean;
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  verified: boolean;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  profilePicture?: string;
  timezone?: string;
  language: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private validatorService: ValidatorService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const {
      email,
      password,
      fullName,
      role = "user",
      timezone,
      language = "en",
    } = createUserDto;

    // Validate input
    if (!this.validatorService.isValidEmail(email)) {
      throw new BadRequestException("Invalid email address");
    }

    const passwordValidation = this.validatorService.isValidPassword(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(
        `Password validation failed: ${passwordValidation.errors.join(", ")}`
      );
    }

    if (timezone && !this.validatorService.isValidTimezone(timezone)) {
      throw new BadRequestException("Invalid timezone");
    }

    if (!this.validatorService.isValidLanguageCode(language)) {
      throw new BadRequestException("Invalid language code");
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await this.cryptoService.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName: this.validatorService.sanitizeString(fullName),
        role,
        timezone,
        language,
      },
    });

    return this.toUserResponse(user);
  }

  async findById(id: number): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toUserResponse(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Validate input
    if (
      updateUserDto.timezone &&
      !this.validatorService.isValidTimezone(updateUserDto.timezone)
    ) {
      throw new BadRequestException("Invalid timezone");
    }

    if (
      updateUserDto.language &&
      !this.validatorService.isValidLanguageCode(updateUserDto.language)
    ) {
      throw new BadRequestException("Invalid language code");
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (updateUserDto.fullName) {
      updateData.fullName = this.validatorService.sanitizeString(
        updateUserDto.fullName
      );
    }

    if (updateUserDto.timezone) {
      updateData.timezone = updateUserDto.timezone;
    }

    if (updateUserDto.language) {
      updateData.language = updateUserDto.language;
    }

    if (updateUserDto.profilePicture) {
      updateData.profilePicture = updateUserDto.profilePicture;
    }

    if (typeof updateUserDto.twoFactorEnabled === "boolean") {
      updateData.twoFactorEnabled = updateUserDto.twoFactorEnabled;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.toUserResponse(updatedUser);
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const passwordValidation =
      this.validatorService.isValidPassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(
        `Password validation failed: ${passwordValidation.errors.join(", ")}`
      );
    }

    const hashedPassword = await this.cryptoService.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
  }

  async verifyUser(id: number): Promise<UserResponse> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    return this.toUserResponse(updatedUser);
  }

  async updateLoginAttempts(id: number, attempts: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        loginAttempts: attempts,
        lockedUntil:
          attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null, // Lock for 15 minutes
      },
    });
  }

  async recordLogin(
    id: number,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    await this.prisma.$transaction([
      // Update user's last login
      this.prisma.user.update({
        where: { id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
          loginAttempts: 0, // Reset login attempts on successful login
          lockedUntil: null,
        },
      }),
      // Record login history
      this.prisma.lastLogin.create({
        data: {
          userId: id,
          ipAddress,
          userAgent,
          successful: true,
        },
      }),
    ]);
  }

  async recordFailedLogin(
    id: number,
    ipAddress: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { loginAttempts: true },
    });

    if (user) {
      await this.updateLoginAttempts(id, user.loginAttempts + 1);
    }

    await this.prisma.lastLogin.create({
      data: {
        userId: id,
        ipAddress,
        userAgent,
        successful: false,
        failureReason: reason,
      },
    });
  }

  async isAccountLocked(id: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { lockedUntil: true },
    });

    return user?.lockedUntil ? user.lockedUntil > new Date() : false;
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<UserResponse[]> {
    const { skip, take, where, orderBy } = params;

    const users = await this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
    });

    return users.map((user) => this.toUserResponse(user));
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async delete(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async updateStatus(
    id: number,
    status: "active" | "inactive" | "suspended"
  ): Promise<UserResponse> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    return this.toUserResponse(updatedUser);
  }

  async getTwoFactorSecret(id: number): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { twoFactorSecret: true },
    });

    return user?.twoFactorSecret || null;
  }

  async setTwoFactorSecret(id: number, secret: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { twoFactorSecret: secret },
    });
  }

  async enableTwoFactor(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { twoFactorEnabled: true },
    });
  }

  async disableTwoFactor(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  private toUserResponse(user: User): UserResponse {
    const { password, twoFactorSecret, ...userResponse } = user;
    return userResponse;
  }
}
