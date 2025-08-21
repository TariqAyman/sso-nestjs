import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

@Controller("tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tenantService.findOne(+id);
  }

  @Get("uuid/:uuid")
  findByUuid(@Param("uuid") uuid: string) {
    return this.tenantService.findByUuid(uuid);
  }

  @Get("key/:key")
  findByKey(@Param("key") key: string) {
    return this.tenantService.findByKey(key);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(+id, updateTenantDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.tenantService.remove(+id);
  }
}
