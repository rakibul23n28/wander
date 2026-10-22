import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function ensureOwner() {
  const email = process.env.OWNER_EMAIL ?? 'owner@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await argon2.hash(process.env.OWNER_PASSWORD ?? 'supersecret123');
  return prisma.user.create({
    data: {
      email,
      name: process.env.OWNER_NAME ?? 'Blog Owner',
      passwordHash,
    },
  });
}

async function seedCategories() {
  const names = ['Travel', 'Lifestyle', 'Photography', 'Food'];
  for (const name of names) {
    await prisma.category.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: {
        name,
        slug: name.toLowerCase(),
      },
    });
  }
}

async function seedPosts() {
  const category = await prisma.category.findUnique({ where: { slug: 'travel' } });
  if (!category) return;

  const posts = [
    {
      title: 'The Art of Getting a Little Lost',
      slug: 'the-art-of-getting-a-little-lost',
      excerpt: 'Somewhere between the wrong turn and the long way home, you find exactly where you’re meant to be.',
      content: '<p>Somewhere between the wrong turn and the long way home, you find exactly where you’re meant to be.</p><h2>The beauty of taking your time</h2><p>There is a different kind of clarity that comes from stepping away.</p>',
      categoryId: category.id,
      status: 'PUBLISHED',
      featured: true,
      isSample: true,
      mediaType: 'IMAGE',
      previewImageUrl: 'https://images.unsplash.com/photo-1464822759023-dda701c7f80b',
      previewImageAlt: 'The Art of Getting a Little Lost',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      views: 9800,
    },
    {
      title: 'Where the Mountains Meet the Sky',
      slug: 'where-the-mountains-meet-the-sky',
      excerpt: 'Early mornings, alpine air, and a reminder of just how small—and lucky—we are.',
      content: '<p>Early mornings, alpine air, and a reminder of just how small—and lucky—we are.</p><blockquote>“Not all those who wander are lost.”</blockquote>',
      categoryId: category.id,
      status: 'PUBLISHED',
      isSample: true,
      mediaType: 'IMAGE',
      previewImageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
      previewImageAlt: 'Where the Mountains Meet the Sky',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50),
      views: 7250,
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }
}

async function main() {
  await ensureOwner();
  await seedCategories();
  await seedPosts();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
