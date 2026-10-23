import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { excerptFromHtml, readingTime, slugify } from '../common/utils.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PostStatus = {
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT',
} as const;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private toStatus(status?: string) {
    return status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT;
  }

  private async resolveCategoryId(categoryId?: string, categoryName?: string) {
    if (categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (category) return category.id;
    }

    const name = (categoryName ?? '').trim();
    if (!name) {
      const defaultCategory = await this.prisma.category.findFirst({ orderBy: { createdAt: 'asc' } });
      return defaultCategory?.id ?? null;
    }

    const category = await this.prisma.category.upsert({
      where: { slug: slugify(name) || 'uncategorized' },
      update: { name },
      create: { name, slug: slugify(name) || 'uncategorized' },
    });

    return category.id;
  }

  private async syncTags(tags: Array<string | undefined | null> = []) {
    const unique = [...new Set(tags.filter(Boolean).map((tag) => tag!.trim()).filter(Boolean))];
    if (!unique.length) return [];

    const records = await Promise.all(
      unique.map(async (name) => {
        const slug = slugify(name) || 'tag';
        return this.prisma.tag.upsert({
          where: { slug },
          update: { name },
          create: { name, slug },
        });
      }),
    );

    return records.map((record) => record.id);
  }

  private async replaceTags(postId: string, tags: Array<string | undefined | null>) {
    const existing = await this.prisma.postTag.findMany({ where: { postId } });
    if (existing.length) {
      await this.prisma.postTag.deleteMany({ where: { postId } });
    }

    const tagIds = await this.syncTags(tags);
    if (!tagIds.length) return;

    await this.prisma.postTag.createMany({
      data: tagIds.map((tagId) => ({ postId, tagId })),
      skipDuplicates: true,
    });
  }

  async createPost(input: any) {
    const title = String(input.title ?? '').trim();
    if (!title) throw new BadRequestException('Title is required.');

    const slug = slugify(String(input.slug ?? title)) || 'untitled';
    const uniqueSlug = await this.ensureSlugUnique(slug);
    const categoryId = await this.resolveCategoryId(input.categoryId, input.category);

    const post = await this.prisma.post.create({
      data: {
        title,
        slug: uniqueSlug.suggestion,
        excerpt: String(input.excerpt ?? '').trim() || excerptFromHtml(String(input.content ?? '')),
        content: String(input.content ?? ''),
        categoryId,
        status: this.toStatus(input.status),
        featured: Boolean(input.featured),
        isSample: Boolean(input.isSample),
        mediaType: String(input.mediaType ?? 'IMAGE').toUpperCase(),
        previewImageUrl: input.previewImageUrl ?? null,
        previewImageAlt: input.previewImageAlt ?? null,
        previewMediaId: input.previewMediaId ?? input.previewImageId ?? null,
        videoUrl: input.videoUrl ?? null,
        videoMediaId: input.videoMediaId ?? null,
        youtubeUrl: input.youtubeUrl ?? null,
        youtubeId: input.youtubeUrl ? (input.youtubeId ?? input.youtubeUrl) : input.youtubeId ?? null,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        views: Number(input.views ?? 0),
      },
      include: { category: true, tags: { include: { tag: true } } },
    });

    await this.replaceTags(post.id, input.tags ?? []);

    const record = await this.prisma.post.findUnique({
      where: { id: post.id },
      include: { category: true, tags: { include: { tag: true } } },
    });
    return this.mapPost(record);
  }

  async updatePost(id: string, input: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found.');

    const nextSlug = input.slug ? slugify(String(input.slug)) : post.slug;
    const resolvedSlug = nextSlug || slugify(post.title) || 'untitled';
    const uniqueSlug = await this.ensureSlugUnique(resolvedSlug, id);
    const categoryId = await this.resolveCategoryId(input.categoryId, input.category);

    const update = await this.prisma.post.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: String(input.title).trim() || post.title } : {}),
        ...(input.slug !== undefined || input.title !== undefined ? { slug: uniqueSlug.suggestion } : {}),
        ...(input.excerpt !== undefined ? { excerpt: String(input.excerpt).trim() || excerptFromHtml(String(input.content ?? post.content)) } : {}),
        ...(input.content !== undefined ? { content: String(input.content) } : {}),
        ...(input.categoryId !== undefined || input.category !== undefined ? { categoryId } : {}),
        ...(input.status !== undefined ? { status: this.toStatus(input.status) } : {}),
        ...(input.featured !== undefined ? { featured: Boolean(input.featured) } : {}),
        ...(input.isSample !== undefined ? { isSample: Boolean(input.isSample) } : {}),
        ...(input.mediaType !== undefined ? { mediaType: String(input.mediaType).toUpperCase() } : {}),
        ...(input.previewImageUrl !== undefined ? { previewImageUrl: input.previewImageUrl ?? null } : {}),
        ...(input.previewImageAlt !== undefined ? { previewImageAlt: input.previewImageAlt ?? null } : {}),
        ...((input.previewMediaId !== undefined || input.previewImageId !== undefined)
          ? { previewMediaId: input.previewMediaId ?? input.previewImageId ?? null }
          : {}),
        ...(input.videoUrl !== undefined ? { videoUrl: input.videoUrl ?? null } : {}),
        ...(input.videoMediaId !== undefined ? { videoMediaId: input.videoMediaId ?? null } : {}),
        ...(input.youtubeUrl !== undefined ? { youtubeUrl: input.youtubeUrl ?? null } : {}),
        ...(input.youtubeId !== undefined ? { youtubeId: input.youtubeId ?? null } : {}),
        ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null } : {}),
        ...(input.views !== undefined ? { views: Number(input.views ?? 0) } : {}),
      },
      include: { category: true, tags: { include: { tag: true } } },
    });

    if (input.tags !== undefined) {
      await this.replaceTags(id, input.tags ?? []);
    }

    const record = await this.prisma.post.findUnique({
      where: { id },
      include: { category: true, tags: { include: { tag: true } } },
    });
    return this.mapPost(record);
  }

  async deletePost(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    await this.prisma.post.delete({ where: { id } });
    return { deleted: true };
  }

  async deleteSamplePosts() {
    const posts = await this.prisma.post.deleteMany({ where: { isSample: true } });
    return { deleted: posts.count };
  }

  async getStats() {
    const [totalViews, publishedPosts, draftPosts] = await Promise.all([
      this.prisma.post.aggregate({ _sum: { views: true } }),
      this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      this.prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    ]);

    return {
      totalViews: totalViews._sum.views ?? 0,
      publishedPosts,
      draftPosts,
    };
  }

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
      items: items.map((item) => this.mapPost(item)),
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
    return posts.map((post) => this.mapPost(post));
  }

  async getAdminPostById(id: string) {
    const record = await this.prisma.post.findUnique({
      where: { id },
      include: { category: true, tags: { include: { tag: true } } },
    });
    if (!record) throw new NotFoundException('Post not found.');
    return this.mapPost(record);
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
      previewImageId: post.previewMediaId ?? undefined,
      videoMediaId: post.videoMediaId ?? undefined,
      media: {
        type: post.mediaType?.toLowerCase() === 'video' ? 'video' : post.youtubeId ? 'youtube' : 'image',
        previewImage: post.previewImageUrl
          ? { id: post.previewMediaId ?? undefined, url: post.previewImageUrl, alt: post.previewImageAlt ?? '' }
          : undefined,
        video: post.videoUrl
          ? { id: post.videoMediaId ?? undefined, url: post.videoUrl }
          : undefined,
        youtubeUrl: post.youtubeUrl ?? undefined,
        youtubeId: post.youtubeId ?? undefined,
      },
      content: post.content,
    };
  }
}
