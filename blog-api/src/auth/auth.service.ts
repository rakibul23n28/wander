import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$invalid$invalid', password);
      return null;
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
    return {
      accessToken: this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret-key-change-me',
        expiresIn: expiresIn as any,
      }),
      expiresIn,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async getOwner() {
    const ownerEmail = this.config.get<string>('OWNER_EMAIL') ?? 'owner@example.com';
    return this.prisma.user.findUnique({ where: { email: ownerEmail } });
  }
}
