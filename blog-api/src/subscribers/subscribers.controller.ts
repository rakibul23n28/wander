import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';

class SubscribeDto {
  @IsEmail() email: string;
}

@Controller()
export class SubscribersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('subscribers')
  async subscribe(@Body() dto: SubscribeDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === 'UNSUBSCRIBED') {
        await this.prisma.subscriber.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', unsubscribedAt: null },
        });
      }
      return { ok: true };
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await this.prisma.subscriber.create({
      data: { email, unsubscribeToken: token, status: 'ACTIVE' },
    });

    return { ok: true };
  }

  @Get('subscribers/unsubscribe')
  async unsubscribe(@Query('token') token: string) {
    const subscriber = await this.prisma.subscriber.findFirst({ where: { unsubscribeToken: token } });
    if (!subscriber) return { ok: true };

    await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
    });

    return { ok: true };
  }
}
