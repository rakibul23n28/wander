import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  ParseFilePipe,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { memoryStorage } from 'multer';
import sharp from 'sharp';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

const MAX_IMAGE_MB = Number(process.env.MAX_IMAGE_MB ?? 8);
const MAX_VIDEO_MB = Number(process.env.MAX_VIDEO_MB ?? 50);

type StorageConfig = {
  url: string;
  key: string;
  bucket: string;
};

function getStorageConfig(): StorageConfig {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  const bucket =
    process.env.SUPABASE_STORAGE_BUCKET ?? process.env.SUPABASE_BUCKET ?? 'blog-media';

  if (
    !url ||
    url.includes('example.supabase.co') ||
    !key ||
    ['demo-key', 'demo-secret-key'].includes(key)
  ) {
    throw new ServiceUnavailableException('Image storage is not configured.');
  }

  return { url, key, bucket };
}

function getClient(config: StorageConfig): SupabaseClient {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureBucket(client: SupabaseClient, bucket: string) {
  const { data, error } = await client.storage.getBucket(bucket);
  if (!error && data) return;
  if (error && error.message?.toLowerCase().includes('not found')) {
    const result = await client.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
      fileSizeLimit: MAX_VIDEO_MB * 1024 * 1024,
    });
    if (result.error) {
      console.error('Supabase bucket creation failed:', result.error.message);
      throw new ServiceUnavailableException('Media storage bucket is unavailable.');
    }
    return;
  }
  if (error) {
    console.error('Supabase bucket lookup failed:', error.message);
    throw new ServiceUnavailableException('Media storage bucket is unavailable.');
  }
}

function isAllowedImageType(buffer: Buffer) {
  const signatures = {
    jpg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46],
  };

  for (const [name, bytes] of Object.entries(signatures)) {
    if (bytes.every((value, index) => buffer[index] === value)) {
      return name;
    }
  }

  return null;
}

@Controller()
export class MediaController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('admin/media/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        exceptionFactory: () => new BadRequestException('No file provided.'),
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file provided.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, and WebP uploads are allowed.');
    }

    const detected = isAllowedImageType(file.buffer);
    if (!detected) {
      throw new BadRequestException('Uploaded file is not a valid image.');
    }

    const transformed = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const metadata = await sharp(transformed).metadata();
    const storage = getStorageConfig();
    const client = getClient(storage);
    await ensureBucket(client, storage.bucket);

    const key = `images/${new Date().toISOString().slice(0, 7).replace('-', '/')}/${randomUUID()}.webp`;
    const { data, error } = await client.storage.from(storage.bucket).upload(key, transformed, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });

    if (error || !data) {
      console.error('Supabase image upload failed:', error?.message ?? 'unknown');
      throw new BadRequestException({ statusCode: 502, error: 'Bad Gateway', message: 'STORAGE_UPLOAD_FAILED' });
    }

    const media = await this.prisma.media.create({
      data: {
        kind: 'IMAGE',
        key,
        url: `${storage.url}/storage/v1/object/public/${storage.bucket}/${key}`,
        mime: 'image/webp',
        size: transformed.length,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      },
    });

    return {
      id: media.id,
      url: media.url,
      width: media.width ?? 0,
      height: media.height ?? 0,
      size: media.size,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/media/video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },
    }),
  )
  async uploadVideo(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        exceptionFactory: () => new BadRequestException('No file provided.'),
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!['video/mp4', 'video/webm'].includes(file.mimetype)) {
      throw new BadRequestException('Only MP4 and WebM uploads are allowed.');
    }

    const storage = getStorageConfig();
    const client = getClient(storage);
    await ensureBucket(client, storage.bucket);
    const extension = file.mimetype === 'video/mp4' ? 'mp4' : 'webm';
    const key = `videos/${new Date().toISOString().slice(0, 7).replace('-', '/')}/${randomUUID()}.${extension}`;
    const { data, error } = await client.storage.from(storage.bucket).upload(key, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '31536000',
      upsert: false,
    });

    if (error || !data) {
      console.error('Supabase video upload failed:', error?.message ?? 'unknown');
      throw new BadRequestException({ statusCode: 502, error: 'Bad Gateway', message: 'STORAGE_UPLOAD_FAILED' });
    }

    const media = await this.prisma.media.create({
      data: {
        kind: 'VIDEO',
        key,
        url: `${storage.url}/storage/v1/object/public/${storage.bucket}/${key}`,
        mime: file.mimetype,
        size: file.size,
        width: null,
        height: null,
      },
    });

    return {
      id: media.id,
      url: media.url,
      size: media.size,
      mime: media.mime,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/media/:id')
  async deleteMedia(@Param('id') id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      return { deleted: true };
    }

    const storage = getStorageConfig();
    const client = getClient(storage);
    await ensureBucket(client, storage.bucket);
    const { error } = await client.storage.from(storage.bucket).remove([media.key]);
    if (error) {
      console.error('Supabase media delete failed:', error.message);
    }

    await this.prisma.media.delete({ where: { id } });
    return { deleted: true };
  }
}
