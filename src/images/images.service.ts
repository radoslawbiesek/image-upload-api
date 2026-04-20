import path from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import sharp from 'sharp';
import { Queue } from 'bullmq';

import { Image } from '../database/schema';
import { StorageService } from '../storage/storage.service';
import { CreateImageDto, FitOption } from './dto/create-image.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import { ImagesRepository } from './images.repository';
import { IMAGES_QUEUE, PROCESS_IMAGE_JOB } from './processors/constants';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

@Injectable()
export class ImagesService {
  private readonly bucket: string;
  private readonly cdnBaseUrl: string;

  constructor(
    private readonly imagesRepository: ImagesRepository,
    private readonly storageService: StorageService,
    @InjectQueue(IMAGES_QUEUE) private readonly imagesQueue: Queue,
    config: ConfigService,
  ) {
    this.bucket = config.getOrThrow<string>('AWS_S3_IMAGES_BUCKET');
    this.cdnBaseUrl = config.getOrThrow<string>('CDN_BASE_URL');
  }

  async create(
    file: Express.Multer.File,
    imageDto: Omit<CreateImageDto, 'file'>,
  ) {
    const ext = path.extname(file.originalname);
    if (!ext) {
      throw new BadRequestException('File must have an extension');
    }

    const rawKey = this.buildRawKey(ext);
    const processedKey = this.buildProcessedKey(imageDto.title, ext);

    await this.storageService.upload(
      this.bucket,
      rawKey,
      file.buffer,
      file.mimetype,
    );

    const image = await this.imagesRepository.create({
      title: imageDto.title,
      width: imageDto.width,
      height: imageDto.height,
      fit: imageDto.fit,
      sourceKey: rawKey,
      key: processedKey,
      status: 'pending',
    });

    await this.imagesQueue.add(
      PROCESS_IMAGE_JOB,
      { imageId: image.id, fit: imageDto.fit },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );

    return this.withUrl(image);
  }

  async findAll(query: ListImagesQueryDto) {
    const rows = await this.imagesRepository.findMany({
      title: query.title,
      cursor: query.cursor,
      limit: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const nextCursor = hasMore ? rows[query.limit]?.id : null;
    const data = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      data: data.map((img) => this.withUrl(img)),
      nextCursor: nextCursor ?? null,
    };
  }

  async processImage(imageId: string, fit: FitOption): Promise<void> {
    const image = await this.imagesRepository.findById(imageId);
    if (!image || !image.sourceKey || !image.key) {
      throw new Error(
        `Image does not have all required fields. Image: ${JSON.stringify(image)}`,
      );
    }

    const ext = path.extname(image.sourceKey).toLowerCase();
    const mimeType = MIME_TYPES[ext];
    if (!mimeType) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }

    const raw = await this.storageService.getObject(
      this.bucket,
      image.sourceKey,
    );
    const resized = await sharp(raw)
      .resize(image.width, image.height, { fit })
      .toBuffer();

    await this.storageService.upload(this.bucket, image.key, resized, mimeType);
    await this.storageService.deleteObject(this.bucket, image.sourceKey);
    await this.imagesRepository.update(imageId, {
      status: 'ready',
      sourceKey: null,
      processedAt: new Date(),
    });
  }

  async markFailed(imageId: string): Promise<void> {
    await this.imagesRepository.update(imageId, {
      status: 'failed',
      key: null,
      processedAt: new Date(),
    });
  }

  async findOne(id: string) {
    const image = await this.imagesRepository.findById(id);
    if (!image) {
      throw new NotFoundException(`Image ${id} not found`);
    }

    return this.withUrl(image);
  }

  buildRawKey(ext: string) {
    return `raw/${randomUUID()}${ext}`;
  }

  buildProcessedKey(title: string, ext: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const suffix = randomUUID().replace(/-/g, '').slice(0, 7);
    return `${slug}-${suffix}${ext}`;
  }

  withUrl(image: Image) {
    return {
      ...image,
      url: image.key ? `${this.cdnBaseUrl}/${image.key}` : null,
    };
  }
}
