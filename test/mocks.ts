import { faker } from '@faker-js/faker';
import type { DatabaseService } from '../src/database/database.module';
import { Image, images, NewImage } from '../src/database/schema';

type DrizzleType = DatabaseService['drizzle'];

export function createMockImage(overrides?: Partial<NewImage>): NewImage {
  return {
    title: faker.lorem.words(3),
    width: faker.number.int({ min: 100, max: 4000 }),
    height: faker.number.int({ min: 100, max: 4000 }),
    ...overrides,
  };
}

export async function saveMockImage(
  db: DrizzleType,
  overrides?: Partial<NewImage>,
): Promise<Image> {
  const [image] = await db
    .insert(images)
    .values(createMockImage(overrides))
    .returning();

  if (!image) {
    throw new Error('Failed to create an image');
  }

  return image;
}

export async function clearMockImages(db: DrizzleType): Promise<void> {
  await db.delete(images);
}
