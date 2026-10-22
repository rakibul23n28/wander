import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostsService } from './posts.service.js';

const PostStatus = {
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT',
} as const;

class QueryPostDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsString() status?: string;
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
}

@Controller()
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('posts')
  async listPosts(@Query() query: QueryPostDto) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 9)));
    return this.postsService.listPublicPosts(page, limit, query.category, query.tag, query.q);
  }

  @Get('posts/:slug')
  async getPost(@Req() req: any, @Param('slug') slug: string) {
    const token = req.headers.authorization?.split(' ')[1];
    const hasOwnerToken = !!token;

    const record = await this.prisma.post.findUnique({
      where: { slug },
      include: { category: true, tags: { include: { tag: true } } },
    });

    if (!record) {
      return { statusCode: 404, error: 'Not Found', message: 'Post not found.' };
    }

    if (record.status !== PostStatus.PUBLISHED && !hasOwnerToken) {
      return { statusCode: 404, error: 'Not Found', message: 'Post not found.' };
    }

    return this.postsService.mapPost(record);
  }

  @Post('posts/:id/view')
  async countView(@Param('id') id: string, @Req() req: any) {
    const userAgent = req.headers['user-agent'] ?? '';
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    const hash = await (await import('crypto')).createHash('sha256').update(`${ip}${userAgent}${day}${process.env.VIEW_SALT_SECRET ?? 'dev-view-salt'}`).digest('hex');
    return this.postsService.incrementView(id, hash, day);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/posts')
  async adminPosts(@Query() query: QueryPostDto) {
    return this.postsService.getAdminPosts(query.status ?? 'all');
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/posts/check-slug')
  async checkSlug(@Query('slug') slug: string, @Query('excludeId') excludeId?: string) {
    return this.postsService.ensureSlugUnique(slug, excludeId);
  }
}
