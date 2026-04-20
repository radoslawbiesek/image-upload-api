import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Job } from 'bullmq';

import { ImageProcessor, type ProcessImageJobData } from './image.processor';
import { ImagesService } from '../images.service';
import type { FitOption } from '../dto/create-image.dto';
import { randomUUID } from 'node:crypto';

function createMockJob(overrides: Partial<Job> = {}) {
  return {
    id: 'job-1',
    data: { imageId: randomUUID(), fit: 'cover' as FitOption },
    attemptsMade: 1,
    opts: { attempts: 3 },
    ...overrides,
  } as Job<ProcessImageJobData>;
}

describe('ImageProcessor', () => {
  let processor: ImageProcessor;
  let imagesService: jest.Mocked<
    Pick<ImagesService, 'processImage' | 'markFailed'>
  >;

  beforeEach(async () => {
    imagesService = {
      processImage: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageProcessor,
        { provide: ImagesService, useValue: imagesService },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    processor = module.get(ImageProcessor);
  });

  describe('process', () => {
    it('calls processImage with imageId and fit from job data', async () => {
      const job = createMockJob();

      await processor.process(job);

      expect(imagesService.processImage).toHaveBeenCalledWith(
        job.data.imageId,
        job.data.fit,
      );
    });
  });

  describe('onFailed', () => {
    it('does not call markFailed when the attempts made are lt 3', async () => {
      const job = createMockJob({ attemptsMade: 1, opts: { attempts: 3 } });

      await processor.onFailed(job, new Error('some error'));

      expect(imagesService.markFailed).not.toHaveBeenCalled();
    });

    it('calls markFailed on the last attempt', async () => {
      const job = createMockJob({ attemptsMade: 3, opts: { attempts: 3 } });

      await processor.onFailed(job, new Error('some error'));

      expect(imagesService.markFailed).toHaveBeenCalledWith(job.data.imageId);
    });
  });
});
