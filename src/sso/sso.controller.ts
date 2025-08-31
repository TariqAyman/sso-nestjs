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
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import {
  SsoService,
  CreateSsoApplicationDto,
  UpdateSsoApplicationDto,
} from "./sso.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("SSO Applications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("sso/applications")
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Post()
  @ApiOperation({ summary: "Create a new SSO application" })
  @ApiResponse({
    status: 201,
    description: "SSO application created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 409, description: "Application name already exists" })
  async createApplication(
    @Request() req,
    @Body() createSsoApplicationDto: CreateSsoApplicationDto
  ) {
    return this.ssoService.createApplication(
      req.user.id,
      createSsoApplicationDto
    );
  }

  @Get()
  @ApiOperation({ summary: "Get user SSO applications" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiResponse({
    status: 200,
    description: "Applications retrieved successfully",
  })
  async getUserApplications(
    @Request() req,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10",
    @Query("search") search?: string,
    @Query("status") status?: string
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    return this.ssoService.findUserApplications(req.user.id, {
      skip,
      take: limitNum,
      search,
      status,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get SSO application by ID" })
  @ApiResponse({
    status: 200,
    description: "Application retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Application not found" })
  async getApplicationById(@Request() req, @Param("id") id: string) {
    return this.ssoService.findById(id, req.user.id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update SSO application" })
  @ApiResponse({ status: 200, description: "Application updated successfully" })
  @ApiResponse({ status: 404, description: "Application not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async updateApplication(
    @Request() req,
    @Param("id") id: string,
    @Body() updateSsoApplicationDto: UpdateSsoApplicationDto
  ) {
    return this.ssoService.updateApplication(
      id,
      req.user.id,
      updateSsoApplicationDto
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete SSO application" })
  @ApiResponse({ status: 204, description: "Application deleted successfully" })
  @ApiResponse({ status: 404, description: "Application not found" })
  async deleteApplication(@Request() req, @Param("id") id: string) {
    return this.ssoService.deleteApplication(id, req.user.id);
  }

  @Post(":id/regenerate-secret")
  @ApiOperation({ summary: "Regenerate client secret for SSO application" })
  @ApiResponse({
    status: 200,
    description: "Client secret regenerated successfully",
  })
  @ApiResponse({ status: 404, description: "Application not found" })
  async regenerateClientSecret(@Request() req, @Param("id") id: string) {
    return this.ssoService.regenerateClientSecret(id, req.user.id);
  }
}
