import path from 'node:path';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Image } from '../database/schema';
import { StorageService } from '../storage/storage.service';
import { CreateImageDto } from './dto/create-image.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import { ImagesRepository } from './images.repository';

@Injectable()
export class ImagesService {
  private readonly bucket: string;

  constructor(
    private readonly imagesRepository: ImagesRepository,
    private readonly storageService: StorageService,
    config: ConfigService,
  ) {
    this.bucket = config.getOrThrow<string>('AWS_S3_IMAGES_BUCKET');
  }

  async create(file: Express.Multer.File, dto: CreateImageDto): Promise<Image> {
    const ext = path.extname(file.originalname);
    if (!ext) {
      throw new BadRequestException('File must have an extension');
    }

    const key = this.storageService.buildKey('originals', ext);
    await this.storageService.upload(
      this.bucket,
      key,
      file.buffer,
      file.mimetype,
    );

    return this.imagesRepository.create({ ...dto, sourceUrl: key });
  }

  async findAll(
    query: ListImagesQueryDto,
  ): Promise<{ data: Image[]; nextCursor: string | null }> {
    const rows = await this.imagesRepository.findMany({
      search: query.search,
      cursor: query.cursor,
      limit: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    return {
      data: hasMore ? rows.slice(0, query.limit) : rows,
      nextCursor: hasMore ? (rows[query.limit]?.id ?? null) : null,
    };
  }

  async findOne(id: string): Promise<Image> {
    const image = await this.imagesRepository.findById(id);
    if (!image) {
      throw new NotFoundException(`Image ${id} not found`);
    }

    return image;
  }
}
