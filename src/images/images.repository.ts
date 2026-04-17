import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, lte, SQL } from 'drizzle-orm';

import { DatabaseService } from '../database/database.module';
import { Image, images, NewImage } from '../database/schema';

export type FindManyOptions = {
  search?: string;
  cursor?: string;
  limit: number;
};

@Injectable()
export class ImagesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: NewImage): Promise<Image> {
    const [image] = await this.databaseService.drizzle
      .insert(images)
      .values(data)
      .returning();

    return image;
  }

  async findMany(options: FindManyOptions): Promise<Image[]> {
    const conditions: (SQL | undefined)[] = [];
    if (options.search) {
      conditions.push(ilike(images.title, `%${options.search}%`));
    }
    if (options.cursor) {
      conditions.push(lte(images.id, options.cursor));
    }

    return this.databaseService.drizzle
      .select()
      .from(images)
      .where(and(...conditions))
      .orderBy(desc(images.id))
      .limit(options.limit);
  }

  async findById(id: string): Promise<Image | null> {
    const [image] = await this.databaseService.drizzle
      .select()
      .from(images)
      .where(eq(images.id, id));

    return image ?? null;
  }
}
