import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateImageDto } from './dto/create-image.dto';
import { ImageResponseDto } from './dto/image-response.dto';
import { ImagesResponseDto } from './dto/images-response.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import { ImagesRepository } from './images.repository';

@Injectable()
export class ImagesService {
  constructor(private readonly imagesRepository: ImagesRepository) {}

  async create(dto: CreateImageDto): Promise<ImageResponseDto> {
    const image = await this.imagesRepository.create({
      ...dto,
      sourceUrl: '', // TODO: set after S3 upload
    });

    return image;
  }

  async findAll(query: ListImagesQueryDto): Promise<ImagesResponseDto> {
    const limit = query.limit ?? 20;
    const rows = await this.imagesRepository.findMany({
      search: query.search,
      cursor: query.cursor,
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? rows[limit].id : null;

    return { data, nextCursor };
  }

  async findOne(id: string): Promise<ImageResponseDto> {
    const image = await this.imagesRepository.findById(id);
    if (!image) {
      throw new NotFoundException(`Image ${id} not found`);
    }

    return image;
  }
}
