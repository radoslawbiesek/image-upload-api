import { Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { ImageResponseDto } from './dto/image-response.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import { ImagesResponseDto } from './dto/images-response.dto';

@Injectable()
export class ImagesService {
  private readonly MOCK_IMAGE: ImageResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    url: 'https://placeholder.example.com/image.jpg',
    title: 'MOCK image',
    width: 1920,
    height: 1080,
  };

  async create(dto: CreateImageDto): Promise<ImageResponseDto> {
    return {
      ...this.MOCK_IMAGE,
      title: dto.title,
      width: dto.width,
      height: dto.height,
    };
  }

  async findAll(_query: ListImagesQueryDto): Promise<ImagesResponseDto> {
    return { data: [this.MOCK_IMAGE], nextCursor: null };
  }

  async findOne(id: string): Promise<ImageResponseDto> {
    return { ...this.MOCK_IMAGE, id };
  }
}
