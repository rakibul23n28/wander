import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MediaController } from './media.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MediaController],
})
export class MediaModule {}
