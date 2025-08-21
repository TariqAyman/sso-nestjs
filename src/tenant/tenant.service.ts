import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Tenant } from "@prisma/client";
import { CreateTenantDto } from "./dto/create-tenant.dto";

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: createTenantDto,
    });
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany();
  }

  async findOne(id: number): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findByUuid(uuid: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { uuid } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with UUID ${uuid} not found`);
    }
    return tenant;
  }

  async findByKey(key: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { key } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with key ${key} not found`);
    }
    return tenant;
  }

  async update(id: number, updateTenantDto: any): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: number): Promise<void> {
    const tenant = await this.findOne(id);
    await this.prisma.tenant.delete({ where: { id } });
  }
}
