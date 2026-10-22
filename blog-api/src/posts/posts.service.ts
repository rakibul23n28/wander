import { Injectable } from '@nestjs/common';
import { excerptFromHtml, readingTime, slugify } from '../common/utils.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PostStatus = {
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT',
} as const;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicPosts(page = 1, limit = 9, category?: string, tag?: string, q?: string) {
    const where: any = { status: PostStatus.PUBLISHED };
    if (category) where.category = { is: { slug: category } };
    if (tag) where.tags = { some: { tag: { slug: tag } } };
    if (q) {
      const query = q.trim();
      if (query) {
        where.AND = [
          { title: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
        ];
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map(this.mapPost),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: page * limit < total,
      },
    };
  }

  async getPublicPostBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: { category: true, tags: { include: { tag: true } } },
    });

    if (!post || post.status !== PostStatus.PUBLISHED) return null;
    return this.mapPost(post);
  }

  async getAdminPosts(status?: string) {
    const where: any = {};
    if (status && status !== 'all') where.status = status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT;
    const posts = await this.prisma.post.findMany({
      where,
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return posts.map(this.mapPost);
  }

  async ensureSlugUnique(base: string, excludeId?: string) {
    const slug = slugify(base) || 'untitled';
    const existing = await this.prisma.post.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return { available: true, suggestion: slug };

    let candidate = slug;
    let i = 2;
    while (true) {
      candidate = `${slug}-${i}`;
      const match = await this.prisma.post.findUnique({ where: { slug: candidate } });
      if (!match || match.id === excludeId) return { available: true, suggestion: candidate };
      i += 1;
    }
  }

  async incrementView(postId: string, visitorHash: string, day: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.status !== PostStatus.PUBLISHED) return { views: post?.views ?? 0, counted: false };

    const existing = await this.prisma.postViewLog.findUnique({
      where: {
        postId_visitorHash_day: { postId, visitorHash, day },
      },
    });

    if (existing) {
      return { views: post.views, counted: false };
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.postViewLog.create({
        data: {
          postId,
          visitorHash,
          day,
        },
      });
      await tx.post.update({
        where: { id: postId },
        data: { views: { increment: 1 } },
      });
    });

    const updated = await this.prisma.post.findUnique({ where: { id: postId } });
    return { views: updated?.views ?? 0, counted: true };
  }

  public mapPost(post: any) {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || excerptFromHtml(post.content),
      category: post.category?.name ?? null,
      categorySlug: post.category?.slug ?? null,
      tags: post.tags?.map((item: any) => item.tag.name) ?? [],
      status: post.status === PostStatus.PUBLISHED ? 'published' : 'draft',
      featured: !!post.featured,
      isSample: !!post.isSample,
      views: post.views ?? 0,
      readingTime: post.readingTime ?? readingTime(post.content),
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
      createdAt: new Date(post.createdAt).toISOString(),
      updatedAt: new Date(post.updatedAt).toISOString(),
      media: {
        type: post.mediaType?.toLowerCase() === 'video' ? 'video' : post.youtubeId ? 'youtube' : 'image',
        previewImage: post.previewImageUrl ? { url: post.previewImageUrl, alt: post.previewImageAlt ?? '' } : undefined,
        video: post.videoUrl ? { url: post.videoUrl } : undefined,
        youtubeUrl: post.youtubeUrl ?? undefined,
        youtubeId: post.youtubeId ?? undefined,
      },
      content: post.content,
    };
  }
}
