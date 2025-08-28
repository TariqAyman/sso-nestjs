import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    // Since email is no longer unique without organizationId, we need to handle this differently
    // For now, we'll use the first match but ideally should include organizationId
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  async updateLastLogin(
    id: bigint,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });
  }
}
