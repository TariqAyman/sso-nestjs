import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { SsoApplication, SsoApplicationStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import { CryptoService } from "../common/services/crypto.service";
import { ValidatorService } from "../common/services/validator.service";

export interface CreateSsoApplicationDto {
  applicationName: string;
  applicationUrl: string;
  redirectUri: string;
  scope?: string;
  description?: string;
  logoUrl?: string;
  webhookUrl?: string;
  allowedOrigins?: string;
  tokenExpirationTime?: number;
  refreshTokenEnabled?: boolean;
}

export interface UpdateSsoApplicationDto {
  applicationName?: string;
  applicationUrl?: string;
  redirectUri?: string;
  scope?: string;
  description?: string;
  logoUrl?: string;
  webhookUrl?: string;
  allowedOrigins?: string;
  tokenExpirationTime?: number;
  refreshTokenEnabled?: boolean;
  status?: "active" | "inactive" | "suspended";
}

export interface SsoApplicationResponse {
  id: string;
  applicationName: string;
  applicationUrl: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  status: string;
  allowedOrigins?: string;
  tokenExpirationTime: number;
  refreshTokenEnabled: boolean;
  description?: string;
  logoUrl?: string;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private validatorService: ValidatorService
  ) {}

  async createApplication(
    userId: string,
    createDto: CreateSsoApplicationDto
  ): Promise<SsoApplicationResponse> {
    // Validate input
    if (
      !this.validatorService.isValidApplicationName(createDto.applicationName)
    ) {
      throw new BadRequestException("Invalid application name");
    }

    if (!this.validatorService.isValidUrl(createDto.applicationUrl)) {
      throw new BadRequestException("Invalid application URL");
    }

    if (!this.validatorService.isValidRedirectUri(createDto.redirectUri)) {
      throw new BadRequestException("Invalid redirect URI");
    }

    if (
      createDto.scope &&
      !this.validatorService.isValidScope(createDto.scope)
    ) {
      throw new BadRequestException("Invalid scope");
    }

    if (
      createDto.webhookUrl &&
      !this.validatorService.isValidUrl(createDto.webhookUrl)
    ) {
      throw new BadRequestException("Invalid webhook URL");
    }

    // Generate client credentials
    const clientId = this.cryptoService.generateClientId();
    const clientSecret = this.cryptoService.generateClientSecret();
    const webhookSecret = createDto.webhookUrl
      ? this.cryptoService.generateSecureToken(32)
      : null;

    try {
      const application = await this.prisma.ssoApplication.create({
        data: {
          clientId,
          clientSecret,
          applicationName: createDto.applicationName,
          applicationUrl: createDto.applicationUrl,
          allowedOrigins: createDto.allowedOrigins,
          redirectUri: createDto.redirectUri,
          organizationId: userId, // Using organizationId instead of userId
          description: createDto.description,
          logoUrl: createDto.logoUrl,
          webhookUrl: createDto.webhookUrl,
          webhookSecret,
          scope: createDto.scope,
          tokenExpirationTime: createDto.tokenExpirationTime,
          refreshTokenEnabled: createDto.refreshTokenEnabled,
        },
      });

      this.logger.log(
        `SSO application created: ${application.applicationName} (${application.clientId})`
      );

      return this.toApplicationResponse(application);
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictException("Application name already exists");
      }
      throw error;
    }
  }

  async findUserApplications(
    userId: string,
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: string;
    }
  ): Promise<{ applications: SsoApplicationResponse[]; total: number }> {
    const { skip = 0, take = 10, search, status } = params;

    const where: Prisma.SsoApplicationWhereInput = {
      organizationId: userId, // Changed from userId to organizationId
      ...(status && { status: status as SsoApplicationStatus }),
      ...(search && {
        OR: [
          { applicationName: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [applications, total] = await Promise.all([
      this.prisma.ssoApplication.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.ssoApplication.count({ where }),
    ]);

    return {
      applications: applications.map((app) => this.toApplicationResponse(app)),
      total,
    };
  }

  async findById(id: string, userId?: string): Promise<SsoApplicationResponse> {
    const where: Prisma.SsoApplicationWhereInput = { id };
    if (userId) {
      where.organizationId = userId; // Changed from userId to organizationId
    }

    const application = await this.prisma.ssoApplication.findFirst({ where });

    if (!application) {
      throw new NotFoundException("SSO application not found");
    }

    return this.toApplicationResponse(application);
  }

  async findByClientId(clientId: string): Promise<SsoApplication> {
    const application = await this.prisma.ssoApplication.findUnique({
      where: { clientId },
    });

    if (!application) {
      throw new NotFoundException("SSO application not found");
    }

    return application;
  }

  async updateApplication(
    id: string,
    userId: string,
    updateDto: UpdateSsoApplicationDto
  ): Promise<SsoApplicationResponse> {
    const application = await this.prisma.ssoApplication.findFirst({
      where: { id, organizationId: userId }, // Changed from userId to organizationId
    });

    if (!application) {
      throw new NotFoundException("SSO application not found");
    }

    // Validate updates
    if (
      updateDto.applicationName &&
      !this.validatorService.isValidApplicationName(updateDto.applicationName)
    ) {
      throw new BadRequestException("Invalid application name");
    }

    if (
      updateDto.applicationUrl &&
      !this.validatorService.isValidUrl(updateDto.applicationUrl)
    ) {
      throw new BadRequestException("Invalid application URL");
    }

    if (
      updateDto.redirectUri &&
      !this.validatorService.isValidRedirectUri(updateDto.redirectUri)
    ) {
      throw new BadRequestException("Invalid redirect URI");
    }

    if (
      updateDto.scope &&
      !this.validatorService.isValidScope(updateDto.scope)
    ) {
      throw new BadRequestException("Invalid scope");
    }

    if (
      updateDto.webhookUrl &&
      !this.validatorService.isValidUrl(updateDto.webhookUrl)
    ) {
      throw new BadRequestException("Invalid webhook URL");
    }

    const updateData: Prisma.SsoApplicationUpdateInput = {};

    if (updateDto.applicationName) {
      updateData.applicationName = this.validatorService.sanitizeString(
        updateDto.applicationName
      );
    }

    if (updateDto.applicationUrl)
      updateData.applicationUrl = updateDto.applicationUrl;
    if (updateDto.redirectUri) updateData.redirectUri = updateDto.redirectUri;
    if (updateDto.scope) updateData.scope = updateDto.scope;
    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description
        ? this.validatorService.sanitizeString(updateDto.description)
        : null;
    }
    if (updateDto.logoUrl !== undefined) updateData.logoUrl = updateDto.logoUrl;
    if (updateDto.webhookUrl !== undefined) {
      updateData.webhookUrl = updateDto.webhookUrl;
      // Generate new webhook secret if webhook URL is being set
      if (updateDto.webhookUrl && !application.webhookSecret) {
        updateData.webhookSecret = this.cryptoService.generateSecureToken(32);
      }
    }
    if (updateDto.allowedOrigins !== undefined)
      updateData.allowedOrigins = updateDto.allowedOrigins;
    if (updateDto.tokenExpirationTime)
      updateData.tokenExpirationTime = updateDto.tokenExpirationTime;
    if (typeof updateDto.refreshTokenEnabled === "boolean")
      updateData.refreshTokenEnabled = updateDto.refreshTokenEnabled;
    if (updateDto.status)
      updateData.status = updateDto.status as SsoApplicationStatus;

    const updatedApplication = await this.prisma.ssoApplication.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(
      `SSO application updated: ${updatedApplication.applicationName} (${updatedApplication.clientId})`
    );

    return this.toApplicationResponse(updatedApplication);
  }

  async deleteApplication(id: string, userId: string): Promise<void> {
    const application = await this.prisma.ssoApplication.findFirst({
      where: { id, organizationId: userId }, // Changed from userId to organizationId
    });

    if (!application) {
      throw new NotFoundException("SSO application not found");
    }

    await this.prisma.ssoApplication.delete({
      where: { id },
    });

    this.logger.log(
      `SSO application deleted: ${application.applicationName} (${application.clientId})`
    );
  }

  async regenerateClientSecret(
    id: string,
    userId: string
  ): Promise<{ clientSecret: string }> {
    const application = await this.prisma.ssoApplication.findFirst({
      where: { id, organizationId: userId }, // Changed from userId to organizationId
    });

    if (!application) {
      throw new NotFoundException("SSO application not found");
    }

    const newClientSecret = this.cryptoService.generateClientSecret();

    await this.prisma.ssoApplication.update({
      where: { id },
      data: { clientSecret: newClientSecret },
    });

    this.logger.log(
      `Client secret regenerated for: ${application.applicationName} (${application.clientId})`
    );

    return { clientSecret: newClientSecret };
  }

  private toApplicationResponse(
    application: SsoApplication
  ): SsoApplicationResponse {
    const { clientSecret, webhookSecret, ...response } = application;
    return {
      ...response,
      id: response.id, // Already a string UUID
    };
  }
}
