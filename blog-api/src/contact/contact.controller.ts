import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';

class ContactDto {
  @IsString() @Length(2, 80) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @Length(0, 120) subject?: string;
  @IsString() @MinLength(10) message: string;
  @IsOptional() @IsString() website?: string;
}

@Controller()
export class ContactController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('contact')
  async create(@Body() dto: ContactDto) {
    if (dto.website && dto.website.trim()) {
      return { ok: true };
    }

    await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject ?? null,
        message: dto.message,
      },
    });

    return { ok: true };
  }
}
