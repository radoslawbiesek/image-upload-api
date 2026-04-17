import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CreateImageDto } from './dto/create-image.dto';
import { ImageResponseDto } from './dto/image-response.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import { ImagesResponseDto } from './dto/images-response.dto';
import { ImagesService } from './images.service';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a new image' })
  @ApiCreatedResponse({ type: ImageResponseDto })
  async create(@Body() dto: CreateImageDto): Promise<ImageResponseDto> {
    return plainToInstance(
      ImageResponseDto,
      await this.imagesService.create(dto),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Get()
  @ApiOperation({ summary: 'List images with cursor pagination' })
  @ApiOkResponse({ type: ImagesResponseDto })
  async findAll(
    @Query() query: ListImagesQueryDto,
  ): Promise<ImagesResponseDto> {
    return plainToInstance(
      ImagesResponseDto,
      await this.imagesService.findAll(query),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single image by ID' })
  @ApiParam({ name: 'id', description: 'Image UUID' })
  @ApiOkResponse({ type: ImageResponseDto })
  @ApiNotFoundResponse({ description: 'Image not found' })
  async findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    return plainToInstance(
      ImageResponseDto,
      await this.imagesService.findOne(id),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
