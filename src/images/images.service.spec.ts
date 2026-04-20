import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { ImagesService } from './images.service';
import { ImagesRepository } from './images.repository';
import { StorageService } from '../storage/storage.service';
import { IMAGES_QUEUE } from './processors/constants';
import type { Image } from '../database/schema';

jest.mock('sharp', () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized-image')),
  })),
);

const CDN_BASE_URL = 'https://cdn.example.com';
const BUCKET = 'images-bucket';

function createMockImage(overrides: Partial<Image> = {}): Image {
  return {
    id: randomUUID(),
    title: 'Test',
    key: 'test-abc1234.jpg',
    sourceKey: 'raw/uuid.jpg',
    status: 'pending',
    width: 800,
    height: 600,
    fit: 'cover',
    createdAt: new Date(),
    processedAt: null,
    ...overrides,
  };
}

describe('ImagesService', () => {
  let service: ImagesService;
  let repository: jest.Mocked<ImagesRepository>;
  let storageService: jest.Mocked<StorageService>;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<ImagesRepository>;

    storageService = {
      upload: jest.fn().mockResolvedValue(undefined),
      getObject: jest.fn(),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<StorageService>;

    queue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: ImagesRepository, useValue: repository },
        { provide: StorageService, useValue: storageService },
        { provide: getQueueToken(IMAGES_QUEUE), useValue: queue },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'AWS_S3_IMAGES_BUCKET') return BUCKET;
              if (key === 'CDN_BASE_URL') return CDN_BASE_URL;
              throw new Error(`Unknown config key: ${key}`);
            },
          },
        },
      ],
    }).compile();

    service = module.get(ImagesService);
  });

  describe('create', () => {
    const file = {
      originalname: 'photo.jpg',
      buffer: Buffer.from('data'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    it('throws BadRequestException when file has no extension', async () => {
      await expect(
        service.create(
          { ...file, originalname: 'noextensionfile' },
          createMockImage(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('uploads file, saves to DB and enqueues job', async () => {
      const image = createMockImage();

      repository.create.mockResolvedValue(image);

      await service.create(file, image);

      expect(storageService.upload).toHaveBeenCalledWith(
        BUCKET,
        expect.stringMatching(/^raw\/[0-9a-f-]{36}\.jpg/),
        file.buffer,
        file.mimetype,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: image.title,
          width: image.width,
          height: image.height,
          fit: image.fit,
          status: 'pending',
        }),
      );

      expect(queue.add).toHaveBeenCalledWith(
        expect.any(String),
        { imageId: image.id, fit: image.fit },
        expect.any(Object),
      );
    });
  });

  describe('processImage', () => {
    it('throws when image is missing sourceKey', async () => {
      repository.findById.mockResolvedValue(
        createMockImage({ sourceKey: null }),
      );

      await expect(service.processImage('uuid-1', 'cover')).rejects.toThrow(
        /required fields/,
      );
    });

    it('throws when image has unsupported extension', async () => {
      repository.findById.mockResolvedValue(
        createMockImage({ sourceKey: 'raw/file.bmp', key: 'file.bmp' }),
      );
      storageService.getObject.mockResolvedValue(Buffer.from('data'));

      await expect(service.processImage(randomUUID(), 'cover')).rejects.toThrow(
        /Unsupported file extension/,
      );
    });

    it('resizes, uploads processed file, deletes source, and marks ready', async () => {
      const image = createMockImage();
      repository.findById.mockResolvedValue(image);

      storageService.getObject.mockResolvedValue(Buffer.from('raw-data'));

      await service.processImage(image.id, image.fit);

      expect(storageService.upload).toHaveBeenCalledWith(
        BUCKET,
        image.key,
        expect.any(Buffer),
        'image/jpeg',
      );
      expect(storageService.deleteObject).toHaveBeenCalledWith(
        BUCKET,
        image.sourceKey,
      );
      expect(repository.update).toHaveBeenCalledWith(
        image.id,
        expect.objectContaining({ status: 'ready', sourceKey: null }),
      );
    });
  });

  describe('markFailed', () => {
    it('updates status to failed and clears key', async () => {
      const uuid = randomUUID();
      repository.update.mockResolvedValue(undefined);

      await service.markFailed(uuid);

      expect(repository.update).toHaveBeenCalledWith(
        uuid,
        expect.objectContaining({ status: 'failed', key: null }),
      );
    });
  });

  describe('buildProcessedKey', () => {
    it('lowercases title, replaces spaces with hyphens and appends a suffix', () => {
      const key = service.buildProcessedKey('Hello World', '.jpg');
      expect(key).toMatch(/^hello-world-[0-9a-f]{7}\.jpg$/);
    });

    it('strips special characters', () => {
      const key = service.buildProcessedKey('Sunset!! Over Mountains', '.png');
      expect(key).toMatch(/^sunset-over-mountains-[0-9a-f]{7}\.png$/);
    });

    it('preserves the file extension', () => {
      expect(service.buildProcessedKey('Test', '.webp')).toMatch(/\.webp$/);
    });
  });
});
