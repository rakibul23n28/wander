import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('health')
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => {
        await this.prismaService.$queryRaw`SELECT 1`;
        return { prisma: { status: 'up' } };
      },
    ]);
  }
}
