import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WebhookService } from "./webhook.service";
import { PrismaService } from "../common/prisma/prisma.service";

@ApiTags("Webhooks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("webhooks")
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly prisma: PrismaService
  ) {}

  @Get("logs")
  @ApiOperation({ summary: "Get webhook logs for user applications" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "applicationId", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "event", required: false, type: String })
  @ApiResponse({
    status: 200,
    description: "Webhook logs retrieved successfully",
  })
  async getWebhookLogs(
    @Request() req,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
    @Query("applicationId") applicationId?: string,
    @Query("status") status?: string,
    @Query("event") event?: string
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      ssoApplication: {
        userId: req.user.id,
      },
    };

    if (applicationId) {
      where.ssoApplicationId = parseInt(applicationId, 10);
    }

    if (status) {
      where.status = status;
    }

    if (event) {
      where.event = event;
    }

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          ssoApplication: {
            select: {
              id: true,
              applicationName: true,
              clientId: true,
            },
          },
        },
      }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get("logs/:id")
  @ApiOperation({ summary: "Get webhook log details" })
  @ApiResponse({
    status: 200,
    description: "Webhook log retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Webhook log not found" })
  async getWebhookLog(@Request() req, @Param("id") id: string) {
    const log = await this.prisma.webhookLog.findFirst({
      where: {
        id,
        ssoApplication: {
          organizationId: req.user.id, // Changed from userId to organizationId
        },
      },
      include: {
        ssoApplication: {
          select: {
            id: true,
            applicationName: true,
            clientId: true,
            webhookUrl: true,
          },
        },
      },
    });

    if (!log) {
      throw new Error("Webhook log not found");
    }

    return log;
  }

  @Post("retry/:id")
  @ApiOperation({ summary: "Retry a failed webhook" })
  @ApiResponse({ status: 200, description: "Webhook retry initiated" })
  @ApiResponse({ status: 404, description: "Webhook log not found" })
  async retryWebhook(@Request() req, @Param("id") id: string) {
    const log = await this.prisma.webhookLog.findFirst({
      where: {
        id,
        ssoApplication: {
          organizationId: req.user.id, // Changed from userId to organizationId
        },
        status: "failed",
      },
      include: {
        ssoApplication: true,
      },
    });

    if (!log) {
      throw new Error("Webhook log not found or cannot be retried");
    }

    // Reset the webhook for retry
    await this.prisma.webhookLog.update({
      where: { id },
      data: {
        nextRetryAt: new Date(),
        attempt: Math.min(log.attempt, 2), // Reset to allow retry
      },
    });

    // Trigger retry process
    await this.webhookService.retryFailedWebhooks();

    return { message: "Webhook retry initiated" };
  }

  @Get("stats")
  @ApiOperation({ summary: "Get webhook statistics for user applications" })
  @ApiResponse({
    status: 200,
    description: "Webhook statistics retrieved successfully",
  })
  async getWebhookStats(@Request() req) {
    const stats = await this.prisma.webhookLog.groupBy({
      by: ["status"],
      where: {
        ssoApplication: {
          organizationId: req.user.id, // Changed from userId to organizationId
        },
      },
      _count: {
        id: true,
      },
    });

    const recentActivity = await this.prisma.webhookLog.findMany({
      where: {
        ssoApplication: {
          organizationId: req.user.id, // Changed from userId to organizationId
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        ssoApplication: {
          select: {
            applicationName: true,
          },
        },
      },
    });

    return {
      statusCounts: stats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentActivity,
    };
  }
}
