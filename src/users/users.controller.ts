import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  UsersService,
  CreateUserDto,
  UpdateUserDto,
  UserResponse,
} from "./users.service";
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from "class-validator";

class CreateUserRequestDto {
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
  role?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

class UpdateUserRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}

class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}

class UpdateStatusDto {
  @IsString()
  status: "active" | "inactive" | "suspended";
}

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserRequestDto
  ): Promise<UserResponse> {
    // Add default organizationId for user creation
    const createUserData: CreateUserDto = {
      ...createUserDto,
      organizationId: BigInt(1), // Default organization
      role: createUserDto.role ? parseInt(createUserDto.role) : undefined, // Convert string to number
    };
    return this.usersService.create(createUserData);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all users (Admin only)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  async findAll(
    @Query("page") page = "1",
    @Query("limit") limit = "10",
    @Query("search") search?: string
  ): Promise<{
    users: UserResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            // For JSON field fullName, we need to use string_contains for JSON search
            { fullName: { string_contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.usersService.findMany({
        skip,
        take: limitNum,
        where,
        orderBy: { createdAt: "desc" },
      }),
      this.usersService.count(where),
    ]);

    return {
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  async getProfile(@Request() req): Promise<UserResponse> {
    return this.usersService.findById(req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user by ID (Admin only)" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<UserResponse> {
    return this.usersService.findById(BigInt(id)); // Convert number to bigint
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  async updateProfile(
    @Request() req,
    @Body(ValidationPipe) updateUserDto: UpdateUserRequestDto
  ): Promise<UserResponse> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user by ID (Admin only)" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDto: UpdateUserRequestDto
  ): Promise<UserResponse> {
    return this.usersService.update(id, updateUserDto);
  }

  @Put("profile/password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user password" })
  @ApiResponse({ status: 200, description: "Password updated successfully" })
  async updatePassword(
    @Request() req,
    @Body(ValidationPipe) updatePasswordDto: UpdatePasswordDto
  ): Promise<{ message: string }> {
    await this.usersService.updatePassword(
      req.user.id,
      updatePasswordDto.newPassword
    );
    return { message: "Password updated successfully" };
  }

  @Put(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user status (Admin only)" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body(ValidationPipe) updateStatusDto: UpdateStatusDto
  ): Promise<UserResponse> {
    // Map string status to number
    const statusMap = {
      active: 1,
      inactive: 0,
      suspended: 2,
    };
    return this.usersService.updateStatus(
      BigInt(id),
      statusMap[updateStatusDto.status]
    ); // Convert number to bigint and map status
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete user (Admin only)" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ message: string }> {
    await this.usersService.delete(BigInt(id)); // Convert number to bigint
    return { message: "User deleted successfully" };
  }

  @Post("profile/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify current user" })
  @ApiResponse({ status: 200, description: "User verified successfully" })
  async verifyUser(@Request() req): Promise<UserResponse> {
    return this.usersService.verifyUser(req.user.id);
  }

  @Post("profile/two-factor/enable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enable two-factor authentication" })
  @ApiResponse({
    status: 200,
    description: "Two-factor authentication enabled",
  })
  async enableTwoFactor(@Request() req): Promise<{ message: string }> {
    await this.usersService.enableTwoFactor(req.user.id);
    return { message: "Two-factor authentication enabled" };
  }

  @Post("profile/two-factor/disable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Disable two-factor authentication" })
  @ApiResponse({
    status: 200,
    description: "Two-factor authentication disabled",
  })
  async disableTwoFactor(@Request() req): Promise<{ message: string }> {
    await this.usersService.disableTwoFactor(req.user.id);
    return { message: "Two-factor authentication disabled" };
  }
}
