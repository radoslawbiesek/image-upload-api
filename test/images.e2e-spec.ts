import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.module';
import type { ImageResponseDto } from '../src/images/dto/image-response.dto';
import type { ImagesResponseDto } from '../src/images/dto/images-response.dto';
import { ImageProcessor } from '../src/images/processors/image.processor';
import { IMAGES_QUEUE } from '../src/images/processors/constants';
import { createApp } from './create-app';
import { clearMockImages, saveMockImage } from './mocks';

const s3Mock = mockClient(S3Client);
s3Mock.on(PutObjectCommand).resolves({});

const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

describe('ImagesController (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService['drizzle'];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken(IMAGES_QUEUE))
      .useValue(mockQueue)
      .overrideProvider(ImageProcessor)
      .useValue({})
      .compile();

    app = await createApp(module);
    db = module.get(DatabaseService).drizzle;
  });

  afterEach(async () => {
    await clearMockImages(db);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /images', () => {
    // Minimal JPEG magic bytes — enough for file-type detection
    const FAKE_FILE = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

    function postImage(fields: Record<string, string | number> = {}) {
      const req = request(app.getHttpServer())
        .post('/images')
        .attach('file', FAKE_FILE, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });
      for (const [key, value] of Object.entries(fields)) {
        req.field(key, String(value));
      }
      return req;
    }

    it('returns 201 with image shape', async () => {
      const res = await postImage({
        title: 'Test image',
        width: 800,
        height: 600,
      }).expect(201);

      const body = res.body as ImageResponseDto;

      expect(body).toMatchObject({
        title: 'Test image',
        width: 800,
        height: 600,
        status: 'pending',
      });
      expect(body.id).toBeDefined();
      expect(body.url).toBeDefined();
    });

    it.each([
      ['title is missing', { width: 800, height: 600 }],
      ['width is missing', { title: 'Test image', height: 600 }],
      ['height is missing', { title: 'Test image', width: 800 }],
      ['width is 0', { title: 'Test image', width: 0, height: 600 }],
      ['width is negative', { title: 'Test image', width: -1, height: 600 }],
      ['height is 0', { title: 'Test image', width: 800, height: 0 }],
      ['height is negative', { title: 'Test image', width: 800, height: -1 }],
    ])(
      'returns 400 when %s',
      async (_: string, fields: Record<string, string | number>) => {
        await postImage(fields).expect(400);
      },
    );
  });

  describe('GET /images', () => {
    it('returns empty list when no images', async () => {
      const res = await request(app.getHttpServer()).get('/images').expect(200);
      const body = res.body as ImagesResponseDto;

      expect(body).toEqual({ data: [], nextCursor: null });
    });

    it('returns seeded images', async () => {
      await Promise.all([
        saveMockImage(db),
        saveMockImage(db),
        saveMockImage(db),
      ]);

      const res = await request(app.getHttpServer()).get('/images').expect(200);
      const body = res.body as ImagesResponseDto;

      expect(body.data).toHaveLength(3);
      expect(body.nextCursor).toBeNull();
    });

    it('filters by search', async () => {
      await Promise.all([
        saveMockImage(db, { title: 'Beautiful sunset' }),
        saveMockImage(db, { title: 'Mountain landscape' }),
      ]);

      const res = await request(app.getHttpServer())
        .get('/images?title=sunset')
        .expect(200);
      const body = res.body as ImagesResponseDto;

      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.title).toBe('Beautiful sunset');
    });

    it('paginates with cursor', async () => {
      const seeded = await Promise.all(
        Array.from({ length: 5 }, () => saveMockImage(db)),
      );
      const limit = 3;

      const page1Res = await request(app.getHttpServer())
        .get(`/images?limit=${limit}`)
        .expect(200);
      const page1 = page1Res.body as ImagesResponseDto;

      expect(page1.data).toHaveLength(limit);
      expect(page1.nextCursor).not.toBeNull();

      const page2Res = await request(app.getHttpServer())
        .get(`/images?limit=${limit}&cursor=${page1.nextCursor}`)
        .expect(200);
      const page2 = page2Res.body as ImagesResponseDto;

      expect(page2.data).toHaveLength(2);
      expect(page2.nextCursor).toBeNull();

      const seededIds = seeded.map((img) => img.id).sort();
      const returnedIds = [...page1.data, ...page2.data]
        .map((img) => img.id)
        .sort();
      expect(returnedIds).toEqual(seededIds);
    });
  });

  describe('GET /images/:id', () => {
    it('returns image by id', async () => {
      const inserted = await saveMockImage(db);

      const res = await request(app.getHttpServer())
        .get(`/images/${inserted.id}`)
        .expect(200);
      const body = res.body as ImageResponseDto;

      expect(body.id).toBe(inserted.id);
      expect(body.title).toBe(inserted.title);
    });

    it('returns 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/images/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
