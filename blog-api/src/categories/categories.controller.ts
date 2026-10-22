import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

class CategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;
}

@Controller()
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('categories')
  async listCategories() {
    const categories = await this.prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
    });

    return categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: category._count.posts,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/categories')
  async createCategory(@Body() dto: CategoryDto) {
    const slug = dto.name.trim().toLowerCase().replace(/\s+/g, '-');
    return this.prisma.category.create({
      data: { name: dto.name.trim(), slug },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: CategoryDto) {
    const slug = dto.name.trim().toLowerCase().replace(/\s+/g, '-');
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name.trim(), slug },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/categories/:id')
  async deleteCategory(@Param('id') id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });

    if (!category) return { deleted: false };
    if (category._count.posts > 0) {
      throw new Error('Category is still assigned to posts');
    }

    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
