import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
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
import { ImagesResponseDto } from './dto/images-response.dto';
import { ListImagesQueryDto } from './dto/list-images-query.dto';
import { MultipartGuard } from './guards/multipart.guard';
import { imageFilePipe } from './pipes/image-file.pipe';
import { ImagesService } from './images.service';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(MultipartGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new image' })
  @ApiBody({ type: CreateImageDto })
  @ApiCreatedResponse({ type: ImageResponseDto })
  async create(
    @UploadedFile(imageFilePipe) file: Express.Multer.File,
    @Body() dto: CreateImageDto,
  ): Promise<ImageResponseDto> {
    const result = await this.imagesService.create(file, dto);

    return plainToInstance(ImageResponseDto, result);
  }

  @Get()
  @ApiOperation({ summary: 'List images with cursor pagination' })
  @ApiOkResponse({ type: ImagesResponseDto })
  async findAll(
    @Query() query: ListImagesQueryDto,
  ): Promise<ImagesResponseDto> {
    const result = await this.imagesService.findAll(query);

    return plainToInstance(ImagesResponseDto, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single image by ID' })
  @ApiParam({ name: 'id', description: 'Image UUID' })
  @ApiOkResponse({ type: ImageResponseDto })
  @ApiNotFoundResponse({ description: 'Image not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ImageResponseDto> {
    const result = await this.imagesService.findOne(id);

    return plainToInstance(ImageResponseDto, result);
  }
}
