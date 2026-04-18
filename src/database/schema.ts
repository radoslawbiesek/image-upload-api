import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const images = pgTable(
  'images',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    title: text('title').notNull(),
    key: text('key'),
    sourceKey: text('source_key'),
    status: text('status', {
      enum: ['pending', 'ready', 'failed'],
    })
      .notNull()
      .default('pending'),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
  },
  (table) => [
    index('images_title_trgm_idx').using('gin', table.title.op('gin_trgm_ops')),
  ],
);

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
