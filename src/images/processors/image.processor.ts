import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { ImagesService } from '../images.service';
import { IMAGES_QUEUE, PROCESS_IMAGE_JOB } from './constants';

type ProcessImageJobData = { imageId: string };

@Injectable()
@Processor(IMAGES_QUEUE)
export class ImageProcessor extends WorkerHost {
  constructor(
    private readonly logger: Logger,
    private readonly imagesService: ImagesService,
  ) {
    super();
  }

  async process(job: Job<ProcessImageJobData>): Promise<void> {
    if (job.name !== PROCESS_IMAGE_JOB) {
      return;
    }

    const { imageId } = job.data;
    this.logger.log(
      `Processing job ${job.id} for image ${imageId}`,
      ImageProcessor.name,
    );
    await this.imagesService.processImage(imageId);
    this.logger.log(
      `Job ${job.id} completed for image ${imageId}`,
      ImageProcessor.name,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ProcessImageJobData>, error: Error): Promise<void> {
    this.logger.error(
      `Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts ?? 1}): ${error?.message}`,
      ImageProcessor.name,
    );
    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (isLastAttempt) {
      await this.imagesService.markFailed(job.data.imageId);
    }
  }
}
